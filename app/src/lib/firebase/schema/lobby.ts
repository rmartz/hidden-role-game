import type {
  Lobby,
  LobbyConfig,
  LobbyPlayer,
  RoleSlot,
  TimerConfig,
} from "@/lib/types";
import type { PublicLobby } from "@/server/types";

export interface FirebaseLobbyPublic {
  ownerPlayerId: string;
  /** Optional — Firebase omits empty objects, though lobbies always have players. */
  players?: Record<string, FirebaseLobbyPlayer>;
  config: FirebaseLobbyConfig;
  gameId: string | null;
  /** Unix ms timestamp set server-side at lobby creation. Used for TTL cleanup. */
  createdAt?: number;
}

export interface FirebaseLobbyPlayer {
  id: string;
  name: string;
  /** Role assignments visible to this player (teammates they can see). Absent for the game owner. */
  visibleRoles?: { playerId: string; roleDefinitionId: string }[];
}

export interface FirebaseLobbyConfig {
  gameMode: string;
  roleConfigMode: string;
  /** Optional — Firebase omits empty arrays, so may be absent. */
  roleSlots?: FirebaseRoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: string;
  timerConfig?: TimerConfig;
  nominationsEnabled?: boolean;
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
    },
    private: {
      ownerSessionId: lobby.ownerSessionId,
      playerSessions,
    },
  };
}

function lobbyConfigToFirebase(config: LobbyConfig): FirebaseLobbyConfig {
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
    ...(config.timerConfig ? { timerConfig: config.timerConfig } : {}),
    ...(config.nominationsEnabled ? { nominationsEnabled: true } : {}),
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
    config: {
      gameMode: pub.config.gameMode as LobbyConfig["gameMode"],
      roleConfigMode: pub.config
        .roleConfigMode as LobbyConfig["roleConfigMode"],
      roleSlots: (pub.config.roleSlots ?? []).map(firebaseToRoleSlot),
      showConfigToPlayers: pub.config.showConfigToPlayers,
      showRolesInPlay: pub.config
        .showRolesInPlay as LobbyConfig["showRolesInPlay"],
      ...(pub.config.timerConfig
        ? {
            timerConfig: parseTimerConfig(
              pub.config.timerConfig as Record<string, unknown>,
            ),
          }
        : {}),
      nominationsEnabled: pub.config.nominationsEnabled ?? false,
    },
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}

export function firebaseToRoleSlot(s: FirebaseRoleSlot): RoleSlot {
  return { roleId: s.roleId, min: s.min, max: s.max };
}

/** Strips null values from a raw Firebase TimerConfig (Firebase may return null for absent fields). */
export function parseTimerConfig(raw: Record<string, unknown>): TimerConfig {
  return {
    ...(typeof raw["startCountdownSeconds"] === "number"
      ? { startCountdownSeconds: raw["startCountdownSeconds"] }
      : {}),
    ...(typeof raw["nightPhaseSeconds"] === "number"
      ? { nightPhaseSeconds: raw["nightPhaseSeconds"] }
      : {}),
    ...(typeof raw["dayPhaseSeconds"] === "number"
      ? { dayPhaseSeconds: raw["dayPhaseSeconds"] }
      : {}),
    ...(typeof raw["votePhaseSeconds"] === "number"
      ? { votePhaseSeconds: raw["votePhaseSeconds"] }
      : {}),
  };
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
    config: {
      gameMode: pub.config.gameMode as LobbyConfig["gameMode"],
      roleConfigMode: pub.config
        .roleConfigMode as LobbyConfig["roleConfigMode"],
      roleSlots: (pub.config.roleSlots ?? []).map(firebaseToRoleSlot),
      showConfigToPlayers: pub.config.showConfigToPlayers,
      showRolesInPlay: pub.config
        .showRolesInPlay as LobbyConfig["showRolesInPlay"],
      ...(pub.config.timerConfig
        ? {
            timerConfig: parseTimerConfig(
              pub.config.timerConfig as Record<string, unknown>,
            ),
          }
        : {}),
      nominationsEnabled: pub.config.nominationsEnabled ?? false,
    },
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}
