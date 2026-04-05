import type {
  Game,
  GameStatusState,
  PlayerRoleAssignment,
  TimerConfig,
} from "@/lib/types";
import { GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game-modes";
import type { FirebaseLobbyPlayer, FirebaseRoleSlot } from "./lobby";
import {
  firebaseToRoleSlot,
  modeConfigToFirebase,
  parseTimerConfig,
} from "./lobby";

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
  timerConfig: TimerConfig;
  /** Game-mode-specific config stored as a flat record. Firebase omits empty objects. */
  modeConfig?: Record<string, unknown>;
  executionerTargetId?: string;
  /** Unix ms timestamp set server-side at game creation. Used for TTL cleanup. */
  createdAt?: number;
}

export function gameToFirebase(game: Game): FirebaseGamePublic {
  const players: Record<string, FirebaseLobbyPlayer> = {};
  for (const p of game.players) {
    players[p.id] = {
      id: p.id,
      name: p.name,
      ...(p.visiblePlayers.length > 0
        ? { visiblePlayers: p.visiblePlayers }
        : {}),
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
    timerConfig: game.timerConfig,
    ...(() => {
      const mc = modeConfigToFirebase(game.modeConfig);
      return Object.keys(mc).length > 0 ? { modeConfig: mc } : {};
    })(),
    ...(game.executionerTargetId
      ? { executionerTargetId: game.executionerTargetId }
      : {}),
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
    // The TypeScript type says TimerConfig, but old Firebase documents may
    // have partial data (e.g. missing autoAdvance). Cast to raw Record so
    // parseTimerConfig validates each field and fills defaults, rather than
    // blindly trusting the cast value.
    timerConfig: parseTimerConfig(
      pub.timerConfig as unknown as Record<string, unknown>,
    ),
    modeConfig: (() => {
      const gm = pub.gameMode as GameMode;
      const raw = pub.modeConfig ?? {};
      return Object.values(GameMode).includes(gm)
        ? GAME_MODES[gm].parseModeConfig(raw)
        : GAME_MODES[GameMode.Werewolf].parseModeConfig(raw);
    })(),
    ...(pub.executionerTargetId
      ? { executionerTargetId: pub.executionerTargetId }
      : {}),
  };
}
