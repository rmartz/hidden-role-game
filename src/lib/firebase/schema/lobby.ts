import type {
  Lobby,
  LobbyConfig,
  LobbyPlayer,
  ModeConfig,
  RoleBucket,
  RoleBucketSlot,
  TimerConfig,
} from "@/lib/types";
import { isSimpleRoleBucket } from "@/lib/types";
import { DEFAULT_TIMER_CONFIG, GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game/modes";
import type { PublicLobby } from "@/server/types";
import { resolvePlayerOrder } from "@/lib/player-order";

export interface FirebaseLobbyPublic {
  ownerPlayerId: string;
  /** Optional — Firebase omits empty objects, though lobbies always have players. */
  players?: Record<string, FirebaseLobbyPlayer>;
  /** Ordered list of player IDs defining seating positions. Firebase omits absent. */
  playerOrder?: string[];
  config: FirebaseLobbyConfig;
  gameId: string | null;
  /** Player IDs that have readied up. Firebase omits empty arrays. */
  readyPlayerIds?: string[];
  /** Unix ms timestamp set server-side at lobby creation. Used for TTL cleanup. */
  createdAt?: number;
}

export interface FirebaseLobbyPlayer {
  id: string;
  name: string;
  /** When true, this player has no device and is managed entirely by the lobby owner. */
  noDevice?: boolean;
  /** Visible players for this player. Absent for the game owner. */
  visiblePlayers?: { playerId: string; reason: string; roleId?: string }[];
}

export interface FirebaseLobbyConfig {
  gameMode: string;
  roleConfigMode: string;
  /** Optional — Firebase omits empty objects. */
  roleBuckets?: Record<string, FirebaseRoleBucket>;
  showConfigToPlayers: boolean;
  showRolesInPlay: string;
  timerConfig: TimerConfig;
  /** Game-mode-specific config stored as a flat record. Firebase omits empty objects. */
  modeConfig?: Record<string, unknown>;
}

export interface FirebaseRoleBucketSlot {
  roleId: string;
  max?: number;
}

/** Simple form: always assigns playerCount copies of a single role. */
export interface FirebaseSimpleRoleBucket {
  playerCount: number;
  roleId: string;
}

/** Advanced form: multi-role pool with min/max draw constraints. */
export interface FirebaseAdvancedRoleBucket {
  playerCount: number;
  /** Firebase stores arrays as objects with numeric string keys. */
  roles: Record<string, FirebaseRoleBucketSlot>;
  name?: string;
}

export type FirebaseRoleBucket =
  | FirebaseSimpleRoleBucket
  | FirebaseAdvancedRoleBucket;

export interface FirebaseLobbyPrivate {
  ownerSessionId: string;
  playerSessions?: Record<string, string>; // { [playerId]: sessionId }
}

export function lobbyToFirebase(lobby: Lobby): {
  public: FirebaseLobbyPublic;
  private: FirebaseLobbyPrivate;
} {
  const ownerPlayer = lobby.players.find(
    (p) => p.sessionId === lobby.ownerSessionId,
  );

  const players: Record<string, FirebaseLobbyPlayer> = {};
  const playerSessions: Record<string, string> = {};
  for (const p of lobby.players) {
    players[p.id] = {
      id: p.id,
      name: p.name,
      ...(p.noDevice ? { noDevice: true } : {}),
    };
    if (p.sessionId) {
      playerSessions[p.id] = p.sessionId;
    }
  }

  return {
    public: {
      ownerPlayerId: ownerPlayer?.id ?? "",
      players,
      ...(lobby.playerOrder.length > 0
        ? { playerOrder: lobby.playerOrder }
        : {}),
      config: lobbyConfigToFirebase(lobby.config),
      gameId: lobby.gameId ?? null,
      ...(lobby.readyPlayerIds.length > 0
        ? { readyPlayerIds: lobby.readyPlayerIds }
        : {}),
    },
    private: {
      ownerSessionId: lobby.ownerSessionId,
      playerSessions,
    },
  };
}

/** Strip the `gameMode` discriminant before writing to Firebase. */
export function modeConfigToFirebase(
  modeConfig: ModeConfig,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { gameMode: _discriminant, ...rest } = modeConfig;
  return rest;
}

export function roleBucketToFirebase(bucket: RoleBucket): FirebaseRoleBucket {
  if (isSimpleRoleBucket(bucket)) {
    return { playerCount: bucket.playerCount, roleId: bucket.roleId };
  }
  const roles: Record<string, FirebaseRoleBucketSlot> = {};
  bucket.roles.forEach((slot, i) => {
    roles[String(i)] = {
      roleId: slot.roleId,
      ...(slot.max !== undefined ? { max: slot.max } : {}),
    };
  });
  return {
    playerCount: bucket.playerCount,
    roles,
    ...(bucket.name !== undefined ? { name: bucket.name } : {}),
  };
}

export function firebaseToRoleBucket(bucket: FirebaseRoleBucket): RoleBucket {
  if ("roleId" in bucket) {
    return { playerCount: bucket.playerCount, roleId: bucket.roleId };
  }
  const roles: RoleBucketSlot[] = Object.values(bucket.roles).map((s) => ({
    roleId: s.roleId,
    ...(s.max !== undefined ? { max: s.max } : {}),
  }));
  return {
    playerCount: bucket.playerCount,
    roles,
    ...(bucket.name !== undefined ? { name: bucket.name } : {}),
  };
}

function lobbyConfigToFirebase(config: LobbyConfig): FirebaseLobbyConfig {
  const firebaseModeConfig = modeConfigToFirebase(config.modeConfig);
  const hasModeConfig = Object.keys(firebaseModeConfig).length > 0;
  const hasBuckets = config.roleBuckets.length > 0;
  const firebaseBuckets: Record<string, FirebaseRoleBucket> = {};
  config.roleBuckets.forEach((bucket, i) => {
    firebaseBuckets[String(i)] = roleBucketToFirebase(bucket);
  });
  return {
    gameMode: config.gameMode,
    roleConfigMode: config.roleConfigMode,
    ...(hasBuckets ? { roleBuckets: firebaseBuckets } : {}),
    showConfigToPlayers: config.showConfigToPlayers,
    showRolesInPlay: config.showRolesInPlay,
    timerConfig: config.timerConfig,
    ...(hasModeConfig ? { modeConfig: firebaseModeConfig } : {}),
  };
}

export function firebaseToLobby(
  lobbyId: string,
  pub: FirebaseLobbyPublic,
  priv: FirebaseLobbyPrivate,
): Lobby {
  const sessions = priv.playerSessions ?? {};
  const players: LobbyPlayer[] = Object.values(pub.players ?? {}).map((p) => {
    const base = { id: p.id, name: p.name };
    if (p.noDevice) return { ...base, noDevice: true as const };
    return { ...base, sessionId: sessions[p.id] ?? "" };
  });

  return {
    id: lobbyId,
    ownerSessionId: priv.ownerSessionId,
    players,
    playerOrder: resolvePlayerOrder(
      pub.playerOrder,
      players.map((p) => p.id),
    ),
    config: firebaseToLobbyConfig(pub.config),
    readyPlayerIds: pub.readyPlayerIds ?? [],
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}

function firebaseToLobbyConfig(config: FirebaseLobbyConfig): LobbyConfig {
  const gameMode = config.gameMode as LobbyConfig["gameMode"];
  const rawModeConfig = config.modeConfig ?? {};
  const modeConfig = Object.values(GameMode).includes(gameMode)
    ? GAME_MODES[gameMode].parseModeConfig(rawModeConfig)
    : GAME_MODES[GameMode.Werewolf].parseModeConfig(rawModeConfig);

  // Cast required: LobbyConfig is a discriminated union keyed on gameMode, but
  // we construct from runtime Firebase data where the discriminant is a string.
  // This is the single boundary-cast location for LobbyConfig deserialization.
  const roleBuckets: RoleBucket[] = config.roleBuckets
    ? Object.values(config.roleBuckets).map(firebaseToRoleBucket)
    : [];

  return {
    gameMode,
    roleConfigMode: config.roleConfigMode as LobbyConfig["roleConfigMode"],
    roleBuckets,
    showConfigToPlayers: config.showConfigToPlayers,
    showRolesInPlay: config.showRolesInPlay as LobbyConfig["showRolesInPlay"],
    timerConfig: parseTimerConfig(config.timerConfig),
    modeConfig,
  } as LobbyConfig;
}

/**
 * Parses a raw Firebase TimerConfig. Extracts base fields with defaults,
 * then preserves any game-mode-specific fields (e.g., nightPhaseSeconds
 * for Werewolf, electionVoteSeconds for Secret Villain) as-is.
 * The caller casts to the appropriate game-mode timer type.
 */
export function parseTimerConfig(raw: Record<string, unknown>): TimerConfig {
  // Extract base fields with defaults.
  const base: TimerConfig = {
    autoAdvance:
      typeof raw["autoAdvance"] === "boolean"
        ? raw["autoAdvance"]
        : DEFAULT_TIMER_CONFIG.autoAdvance,
    startCountdownSeconds:
      typeof raw["startCountdownSeconds"] === "number"
        ? raw["startCountdownSeconds"]
        : DEFAULT_TIMER_CONFIG.startCountdownSeconds,
  };

  // Preserve any additional game-mode-specific numeric/boolean fields.
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key in base) continue;
    if (typeof value === "number" || typeof value === "boolean") {
      extra[key] = value;
    }
  }

  return { ...base, ...extra } as TimerConfig;
}

/**
 * Converts a FirebaseLobbyPublic node directly to a PublicLobby for client-side
 * consumption. Used by the Firebase client subscription hook.
 */
export function firebaseToPublicLobby(
  lobbyId: string,
  pub: FirebaseLobbyPublic,
): PublicLobby {
  const players = Object.values(pub.players ?? {}).map((p) => ({
    id: p.id,
    name: p.name,
    ...(p.noDevice ? { noDevice: true } : {}),
  }));

  return {
    id: lobbyId,
    ownerPlayerId: pub.ownerPlayerId,
    players,
    playerOrder: resolvePlayerOrder(
      pub.playerOrder,
      players.map((p) => p.id),
    ),
    config: firebaseToLobbyConfig(pub.config),
    readyPlayerIds: pub.readyPlayerIds ?? [],
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}
