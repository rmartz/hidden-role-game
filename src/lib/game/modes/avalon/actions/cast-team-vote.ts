import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { AvalonPhase, TeamVote } from "../types";
import type { AvalonTurnState } from "../types";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

const VALID_VOTES: TeamVote[] = [TeamVote.Approve, TeamVote.Reject];

export const castTeamVoteAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.TeamVote) return false;
    // Voting is closed once resolved
    if (ts.phase.passed !== undefined) return false;
    if (!game.players.some((p) => p.id === callerId)) return false;

    const { vote } = payload as { vote?: unknown };
    return typeof vote === "string" && VALID_VOTES.includes(vote as TeamVote);
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== AvalonPhase.TeamVote) return;

    const { vote } = payload as { vote: TeamVote };

    const existing = ts.phase.votes.findIndex((v) => v.playerId === callerId);
    if (existing >= 0) {
      ts.phase.votes = ts.phase.votes.map((v, i) =>
        i === existing ? { playerId: callerId, vote } : v,
      );
    } else {
      ts.phase.votes = [...ts.phase.votes, { playerId: callerId, vote }];
    }
  },
};
