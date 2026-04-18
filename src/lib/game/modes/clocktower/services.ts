import { GameStatus } from "@/lib/types";
import type { Game, GameModeServices, PlayerRoleAssignment } from "@/lib/types";
import { ClocktowerPhase } from "./types";
import type { ClocktowerTurnState } from "./types";

function buildInitialTurnState(
  roleAssignments: PlayerRoleAssignment[],
): ClocktowerTurnState {
  const playerIds = roleAssignments.map((a) => a.playerId);

  // The Demon player is identified at initialization time.
  // For now we use the first player as a placeholder — full Demon assignment
  // is implemented in the game initialization sub-issue (#354).
  const demonPlayerId = playerIds[0] ?? "";

  return {
    turn: 1,
    phase: {
      type: ClocktowerPhase.Night,
      currentActionIndex: 0,
      nightActions: {},
    },
    playerOrder: playerIds,
    deadPlayerIds: [],
    ghostVotesUsed: [],
    demonPlayerId,
  };
}

export const clocktowerServices: GameModeServices = {
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
  ): ClocktowerTurnState {
    return buildInitialTurnState(roleAssignments);
  },

  selectSpecialTargets(): Record<string, string> {
    return {};
  },

  extractPlayerState(game: Game): Record<string, unknown> {
    if (game.status.type !== GameStatus.Playing) return {};
    const ts = game.status.turnState as ClocktowerTurnState | undefined;
    if (!ts) return {};

    return {
      clocktowerTurn: ts.turn,
      clocktowerPhase: ts.phase.type,
      deadPlayerIds: ts.deadPlayerIds,
      ghostVotesUsed: ts.ghostVotesUsed,
    };
  },
};
