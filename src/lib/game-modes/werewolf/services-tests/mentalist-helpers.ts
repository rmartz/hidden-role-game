import {
  GameMode,
  GameStatus,
  ShowRolesInPlay,
  Team,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import type { Game } from "@/lib/types";
import { WerewolfPhase, WerewolfRole } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";

export const mentalistRole = {
  id: WerewolfRole.Mentalist,
  name: "Mentalist",
  team: Team.Good,
};

export function makeMentalistGame(
  p2Role: WerewolfRole,
  p3Role: WerewolfRole,
  nightActions: Record<string, unknown> = {},
): Game {
  const turnState: WerewolfTurnState = {
    turn: 2,
    phase: {
      type: WerewolfPhase.Nighttime,
      startedAt: 1000,
      nightPhaseOrder: [WerewolfRole.Mentalist],
      currentPhaseIndex: 0,
      nightActions: nightActions as Record<
        string,
        import("@/lib/game-modes/werewolf").AnyNightAction
      >,
    },
    deadPlayerIds: [],
  };
  return {
    id: "game-1",
    lobbyId: "lobby-1",
    gameMode: GameMode.Werewolf,
    status: { type: GameStatus.Playing, turnState },
    players: [
      { id: "p1", name: "Alice", sessionId: "s1", visiblePlayers: [] },
      { id: "p2", name: "Bob", sessionId: "s2", visiblePlayers: [] },
      { id: "p3", name: "Charlie", sessionId: "s3", visiblePlayers: [] },
      { id: "p4", name: "Dave", sessionId: "s4", visiblePlayers: [] },
    ],
    roleAssignments: [
      { playerId: "p1", roleDefinitionId: WerewolfRole.Mentalist },
      { playerId: "p2", roleDefinitionId: p2Role },
      { playerId: "p3", roleDefinitionId: p3Role },
      { playerId: "p4", roleDefinitionId: WerewolfRole.Villager },
    ],
    configuredRoleSlots: [],
    showRolesInPlay: ShowRolesInPlay.None,
    ownerPlayerId: undefined,
    nominationsEnabled: false,
    singleTrialPerDay: true,
    revealProtections: true,
    timerConfig: DEFAULT_TIMER_CONFIG,
  };
}
