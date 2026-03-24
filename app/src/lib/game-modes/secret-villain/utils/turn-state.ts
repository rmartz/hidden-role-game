import { GameStatus } from "@/lib/types";
import type { Game } from "@/lib/types";
import type { SecretVillainTurnState } from "../types";

/** Extracts the Secret Villain turn state from a playing game, or undefined. */
export function currentTurnState(
  game: Game,
): SecretVillainTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as SecretVillainTurnState | undefined;
}

/**
 * Returns the next president player ID in the rotation, skipping eliminated
 * players. If specialPresidentId is set, returns that player instead (one-time
 * override).
 */
export function getNextPresidentId(ts: SecretVillainTurnState): {
  presidentId: string;
  nextIndex: number;
} {
  if (ts.specialPresidentId) {
    // Special president doesn't advance the index — rotation resumes after.
    return {
      presidentId: ts.specialPresidentId,
      nextIndex: ts.currentPresidentIndex,
    };
  }

  const { presidentOrder, eliminatedPlayerIds } = ts;
  let index = ts.currentPresidentIndex;
  let remaining = presidentOrder.length;

  while (remaining > 0) {
    const candidateId = presidentOrder[index % presidentOrder.length];
    if (
      candidateId !== undefined &&
      !eliminatedPlayerIds.includes(candidateId)
    ) {
      return {
        presidentId: candidateId,
        nextIndex: (index + 1) % presidentOrder.length,
      };
    }
    index++;
    remaining--;
  }

  // Should never happen — there must be at least one non-eliminated player.
  throw new Error("No eligible president found in rotation");
}

/**
 * Returns the list of player IDs eligible to be nominated as chancellor.
 * Excludes: the president, eliminated players, and previous administration
 * members (unless there are ≤5 alive players, in which case only the
 * previous chancellor is excluded per standard rules).
 */
export function getEligibleChancellorIds(
  ts: SecretVillainTurnState,
  presidentId: string,
): string[] {
  const aliveCount = ts.presidentOrder.length - ts.eliminatedPlayerIds.length;

  return ts.presidentOrder.filter((playerId) => {
    if (playerId === presidentId) return false;
    if (ts.eliminatedPlayerIds.includes(playerId)) return false;
    if (playerId === ts.previousChancellorId) return false;
    // Previous president is only ineligible when >5 players remain alive.
    if (aliveCount > 5 && playerId === ts.previousPresidentId) return false;
    return true;
  });
}
