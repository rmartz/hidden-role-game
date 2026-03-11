/**
 * Firebase Realtime Database schema types and conversion helpers.
 *
 * Data layout:
 *   /lobbies/{lobbyId}/public   — PublicLobby equivalent (world-readable)
 *   /lobbies/{lobbyId}/private  — ownerSessionId + per-player sessionIds (server-only)
 *   /games/{gameId}/playerState/{sessionId} — pre-computed PlayerGameState
 *
 * Arrays (roleSlots, players, roleAssignments) are stored as Firebase objects
 * (Record keyed by a stable key) to avoid Firebase array-reindexing issues.
 */

import type {
  Lobby,
  LobbyConfig,
  LobbyPlayer,
  Game,
  GameStatusState,
  PlayerRoleAssignment,
  RoleSlot,
} from "@/lib/types";
import type {
  PublicLobby,
  PlayerGameState,
  RoleInPlay,
  VisibleTeammate,
} from "@/server/types";

// ---------------------------------------------------------------------------
// Lobby schema
// ---------------------------------------------------------------------------

export interface FirebaseLobbyPublic {
  ownerPlayerId: string;
  /** Optional — Firebase omits empty objects, though lobbies always have players. */
  players?: Record<string, FirebaseLobbyPlayer>;
  config: FirebaseLobbyConfig;
  gameId: string | null;
}

export interface FirebaseLobbyPlayer {
  id: string;
  name: string;
}

export interface FirebaseLobbyConfig {
  gameMode: string;
  roleConfigMode: string;
  /** Optional — Firebase omits empty arrays, so may be absent. */
  roleSlots?: FirebaseRoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: string;
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

// ---------------------------------------------------------------------------
// Game schema
// ---------------------------------------------------------------------------

export interface FirebaseGamePublic {
  lobbyId: string;
  gameMode: string;
  /** JSON-serialised GameStatusState (preserves the turnState `unknown` type). */
  status: string;
  players: Record<string, FirebaseLobbyPlayer>;
  /** { [playerId]: roleDefinitionId } — optional since Firebase omits empty objects. */
  roleAssignments?: Record<string, string>;
  /** Optional — Firebase omits empty arrays. */
  configuredRoleSlots?: FirebaseRoleSlot[];
  showRolesInPlay: string;
  ownerPlayerId: string | null;
}

// ---------------------------------------------------------------------------
// Lobby conversions
// ---------------------------------------------------------------------------

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
    },
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}

export function firebaseToRoleSlot(s: FirebaseRoleSlot): RoleSlot {
  return { roleId: s.roleId, min: s.min, max: s.max };
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
    },
    ...(pub.gameId ? { gameId: pub.gameId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Game conversions
// ---------------------------------------------------------------------------

export function gameToFirebase(game: Game): FirebaseGamePublic {
  const players: Record<string, FirebaseLobbyPlayer> = {};
  for (const p of game.players) {
    players[p.id] = { id: p.id, name: p.name };
  }

  const roleAssignments: Record<string, string> = {};
  for (const a of game.roleAssignments) {
    roleAssignments[a.playerId] = a.roleDefinitionId;
  }

  return {
    lobbyId: game.lobbyId,
    gameMode: game.gameMode,
    status: JSON.stringify(game.status),
    players,
    roleAssignments,
    configuredRoleSlots: game.configuredRoleSlots.map((s) => ({
      roleId: s.roleId,
      min: s.min,
      max: s.max,
    })),
    showRolesInPlay: game.showRolesInPlay,
    ownerPlayerId: game.ownerPlayerId,
  };
}

export function firebaseToGame(
  gameId: string,
  pub: FirebaseGamePublic,
  gamePlayers: import("@/lib/types").GamePlayer[],
): Game {
  const roleAssignments: PlayerRoleAssignment[] = Object.entries(
    pub.roleAssignments ?? {},
  ).map(([playerId, roleDefinitionId]) => ({ playerId, roleDefinitionId }));

  return {
    id: gameId,
    lobbyId: pub.lobbyId,
    gameMode: pub.gameMode as Game["gameMode"],
    status: JSON.parse(pub.status) as GameStatusState,
    players: gamePlayers,
    roleAssignments,
    configuredRoleSlots: (pub.configuredRoleSlots ?? []).map(
      firebaseToRoleSlot,
    ),
    showRolesInPlay: pub.showRolesInPlay as Game["showRolesInPlay"],
    ownerPlayerId: pub.ownerPlayerId,
  };
}

// ---------------------------------------------------------------------------
// PlayerGameState stored in Firebase
// ---------------------------------------------------------------------------

export interface FirebasePlayerState {
  statusJson: string; // JSON.stringify(GameStatusState)
  gameMode: string;
  players?: FirebaseLobbyPlayer[];
  gameOwner: FirebaseLobbyPlayer | null;
  myRole: { id: string; name: string; team: string } | null;
  visibleRoleAssignments?: {
    player: FirebaseLobbyPlayer;
    role: { id: string; name: string; team: string };
  }[];
  rolesInPlay?: RoleInPlay[] | null;
}

export function playerStateToFirebase(
  state: PlayerGameState,
): FirebasePlayerState {
  return {
    statusJson: JSON.stringify(state.status),
    gameMode: state.gameMode,
    players: state.players,
    gameOwner: state.gameOwner,
    myRole: state.myRole,
    visibleRoleAssignments: state.visibleRoleAssignments,
    rolesInPlay: state.rolesInPlay,
  };
}

export function firebaseToPlayerState(
  raw: FirebasePlayerState,
): PlayerGameState {
  return {
    status: JSON.parse(raw.statusJson) as GameStatusState,
    gameMode: raw.gameMode as PlayerGameState["gameMode"],
    players: raw.players ?? [],
    gameOwner: raw.gameOwner,
    myRole: raw.myRole
      ? {
          id: raw.myRole.id,
          name: raw.myRole.name,
          team: raw.myRole.team as import("@/lib/types").Team,
        }
      : null,
    visibleRoleAssignments: (raw.visibleRoleAssignments ?? []).map(
      (v): VisibleTeammate => ({
        player: v.player,
        role: {
          id: v.role.id,
          name: v.role.name,
          team: v.role.team as import("@/lib/types").Team,
        },
      }),
    ),
    rolesInPlay: raw.rolesInPlay ?? null,
  };
}
