import type { Game, GameAction } from "@/lib/types";
import type { ElectionVote } from "../types";
import { SecretVillainPhase } from "../types";
import { currentTurnState } from "../utils";

const VALID_VOTES: ElectionVote[] = ["aye", "no"];

export const castElectionVoteAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== SecretVillainPhase.ElectionVote) return false;
    if (ts.phase.passed !== undefined) return false;
    if (ts.eliminatedPlayerIds.includes(callerId)) return false;
    if (!game.players.some((p) => p.id === callerId)) return false;

    const { vote } = payload as { vote?: unknown };
    return (
      typeof vote === "string" && VALID_VOTES.includes(vote as ElectionVote)
    );
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== SecretVillainPhase.ElectionVote) return;

    const { vote } = payload as { vote: ElectionVote };

    // Replace existing vote if the player already voted, otherwise append.
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
