import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { AvalonPhase } from "../types";
import type { AvalonTurnState } from "../types";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

export const proposeTeamAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.TeamProposal) return false;
    if (ts.phase.leaderId !== callerId) return false;

    const { teamPlayerIds } = payload as { teamPlayerIds?: unknown };
    if (!Array.isArray(teamPlayerIds)) return false;
    if (teamPlayerIds.length !== ts.phase.teamSize) return false;
    if (!teamPlayerIds.every((id): id is string => typeof id === "string"))
      return false;

    const validPlayerIds = new Set(ts.leaderOrder);
    if (!teamPlayerIds.every((id) => validPlayerIds.has(id))) return false;

    // No duplicate player IDs
    return new Set(teamPlayerIds).size === teamPlayerIds.length;
  },

  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== AvalonPhase.TeamProposal) return;

    const { teamPlayerIds } = payload as { teamPlayerIds: string[] };

    ts.phase = {
      type: AvalonPhase.TeamVote,
      leaderId: ts.phase.leaderId,
      proposedTeam: teamPlayerIds,
      votes: [],
    };
  },
};
