import { GameStatus } from "@/lib/types";
import type { Game, GameModeServices, PlayerRoleAssignment } from "@/lib/types";
import { ClocktowerPhase } from "./types";
import type { ClocktowerTurnState } from "./types";
import { ClocktowerRole } from "./roles";

function buildInitialTurnState(
  roleAssignments: PlayerRoleAssignment[],
): ClocktowerTurnState {
  const playerIds = roleAssignments.map((a) => a.playerId);

  const demonAssignment = roleAssignments.find(
    (a) => a.roleDefinitionId === (ClocktowerRole.Imp as string),
  );
  if (!demonAssignment)
    throw new Error("Clocktower turn state requires an Imp assignment");
  const demonPlayerId = demonAssignment.playerId;

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
      ghostVotesUsed: ts.ghostVotesUsed,
    };
  },
};
