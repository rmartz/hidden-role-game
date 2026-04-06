import type {
  Lobby,
  LobbyConfig,
  LobbyPlayer,
  ModeConfig,
  RoleSlot,
  TimerConfig,
} from "@/lib/types";
import { DEFAULT_TIMER_CONFIG, GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game/modes";
import type { PublicLobby } from "@/server/types";

export interface FirebaseLobbyPublic {
  ownerPlayerId: string;
  /** Optional — Firebase omits empty objects, though lobbies always have players. */
  players?: Record<string, FirebaseLobbyPlayer>;
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
  /** Visible players for this player. Absent for the game owner. */
  visiblePlayers?: { playerId: string; reason: string; roleId?: string }[];
}

export interface FirebaseLobbyConfig {
  gameMode: string;
  roleConfigMode: string;
  /** Optional — Firebase omits empty arrays, so may be absent. */
  roleSlots?: FirebaseRoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: string;
  timerConfig: TimerConfig;
  /** Game-mode-specific config stored as a flat record. Firebase omits empty objects. */
  modeConfig?: Record<string, unknown>;
}

export interface FirebaseRoleSlot {
  roleId: string;
  min: number;
  max: number;
}

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
    players[p.id] = { id: p.id, name: p.name };
    playerSessions[p.id] = p.sessionId;
  }

  return {
    public: {
      ownerPlayerId: ownerPlayer?.id ?? "",
      players,
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

function lobbyConfigToFirebase(config: LobbyConfig): FirebaseLobbyConfig {
  const firebaseModeConfig = modeConfigToFirebase(config.modeConfig);
  const hasModeConfig = Object.keys(firebaseModeConfig).length > 0;
  return {
    gameMode: config.gameMode,
    roleConfigMode: config.roleConfigMode,
    roleSlots: config.roleSlots.map((s) => ({
      roleId: s.roleId,
      min: s.min,
      max: s.max,
    })),
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
  const players: LobbyPlayer[] = Object.values(pub.players ?? {}).map((p) => ({
    id: p.id,
    name: p.name,
    sessionId: sessions[p.id] ?? "",
  }));

  return {
    id: lobbyId,
    ownerSessionId: priv.ownerSessionId,
    players,
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
  return {
    gameMode,
    roleConfigMode: config.roleConfigMode as LobbyConfig["roleConfigMode"],
    roleSlots: (config.roleSlots ?? []).map(firebaseToRoleSlot),
    showConfigToPlayers: config.showConfigToPlayers,
    showRolesInPlay: config.showRolesInPlay as LobbyConfig["showRolesInPlay"],
    timerConfig: parseTimerConfig(
      config.timerConfig as unknown as Record<string, unknown>,
    ),
    modeConfig,
  } as LobbyConfig;
}

export function firebaseToRoleSlot(s: FirebaseRoleSlot): RoleSlot {
  return { roleId: s.roleId, min: s.min, max: s.max };
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
 * consumption. Since the public node stores full config (including roleSlots),
 * all fields are present. Used by the Firebase client subscription hook.
 */
export function firebaseToPublicLobby(
  lobbyId: string,
  pub: FirebaseLobbyPublic,
): PublicLobby {
  return {
    id: lobbyId,
    ownerPlayerId: pub.ownerPlayerId,
    players: Object.values(pub.players ?? {}).map((p) => ({
      id: p.id,
      name: p.name,
    })),
    config: firebaseToLobbyConfig(pub.config),
    readyPlayerIds: pub.readyPlayerIds ?? [],
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}
