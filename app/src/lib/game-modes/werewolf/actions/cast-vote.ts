import type { Game, GameAction } from "@/lib/types";
import type { DaytimeVote } from "../types";
import { WerewolfPhase } from "../types";
import { currentTurnState } from "../utils";
import { applyTrialVerdict } from "./resolve-trial";

const VALID_VOTES: DaytimeVote[] = ["guilty", "innocent"];

export const castVoteAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    // Only non-owner alive players may vote
    if (callerId === game.ownerPlayerId) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return false;
    if (activeTrial.verdict) return false;
    if (ts.deadPlayerIds.includes(callerId)) return false;
    if (!game.players.some((p) => p.id === callerId)) return false;
    if (activeTrial.defendantId === callerId) return false;
    if (activeTrial.votes.some((v) => v.playerId === callerId)) return false;
    const { vote } = payload as { vote?: unknown };
    return (
      typeof vote === "string" && VALID_VOTES.includes(vote as DaytimeVote)
    );
  },
  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return;
    const { vote } = payload as { vote: DaytimeVote };
    activeTrial.votes = [...activeTrial.votes, { playerId: callerId, vote }];

    // Auto-resolve when every eligible player (alive, non-owner, non-defendant) has voted
    const eligibleCount = game.players.filter(
      (p) =>
        p.id !== game.ownerPlayerId &&
        p.id !== activeTrial.defendantId &&
        !ts.deadPlayerIds.includes(p.id),
    ).length;
    if (activeTrial.votes.length >= eligibleCount) {
      applyTrialVerdict(activeTrial, ts, game);
    }
  },
};
