import type {
  Game,
  GameStatusState,
  PlayerRoleAssignment,
  TimerConfig,
} from "@/lib/types";
import type { FirebaseLobbyPlayer, FirebaseRoleSlot } from "./lobby";
import { firebaseToRoleSlot } from "./lobby";

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
  timerConfig?: TimerConfig;
  nominationsEnabled?: boolean;
  /** Unix ms timestamp set server-side at game creation. Used for TTL cleanup. */
  createdAt?: number;
}

export function gameToFirebase(game: Game): FirebaseGamePublic {
  const players: Record<string, FirebaseLobbyPlayer> = {};
  for (const p of game.players) {
    players[p.id] = {
      id: p.id,
      name: p.name,
      ...(p.visibleRoles.length > 0 ? { visibleRoles: p.visibleRoles } : {}),
    };
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
    ownerPlayerId: game.ownerPlayerId ?? null,
    ...(game.timerConfig ? { timerConfig: game.timerConfig } : {}),
    ...(game.nominationsEnabled ? { nominationsEnabled: true } : {}),
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
    ownerPlayerId: pub.ownerPlayerId ?? undefined,
    ...(pub.timerConfig ? { timerConfig: pub.timerConfig } : {}),
    nominationsEnabled: pub.nominationsEnabled ?? false,
  };
}
