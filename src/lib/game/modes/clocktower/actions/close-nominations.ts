import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { ClocktowerPhase } from "../types";
import type { ClocktowerTurnState, ClocktowerNomination } from "../types";

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

/**
 * Determines the nomination to execute, if any.
 *
 * A nomination qualifies when its yes-vote count strictly exceeds 50% of
 * alive players. Among qualifying nominations, the one with the most votes
 * wins. If two or more nominations tie for the highest qualifying count, no
 * execution occurs.
 */
function resolveExecution(
  nominations: ClocktowerNomination[],
  aliveCount: number,
): string | undefined {
  const threshold = aliveCount / 2;

  let topCount = 0;
  let topNomineeId: string | undefined;
  let tied = false;

  for (const nom of nominations) {
    const yesCount = nom.votes.filter((v) => v.voted).length;
    if (yesCount <= threshold) continue;

    if (yesCount > topCount) {
      topCount = yesCount;
      topNomineeId = nom.nomineeId;
      tied = false;
    } else if (yesCount === topCount) {
      tied = true;
    }
  }

  return tied ? undefined : topNomineeId;
}

export const closeNominationsAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    return ts.phase.type === ClocktowerPhase.Day;
  },

  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== ClocktowerPhase.Day) return;

    const aliveCount = game.players.length - ts.deadPlayerIds.length;
    const nomineeId = resolveExecution(ts.phase.nominations, aliveCount);

    if (nomineeId !== undefined) {
      ts.phase.executedToday = nomineeId;
      if (!ts.deadPlayerIds.includes(nomineeId)) {
        ts.deadPlayerIds = [...ts.deadPlayerIds, nomineeId];
      }
    }
  },
};
