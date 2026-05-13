import type { PlayerRoleAssignment } from "@/lib/types";
import { AvalonRole } from "../roles";
import type { QuestResult } from "../types";

export enum AvalonWinner {
  Evil = "Evil",
  Good = "Good",
}

const QUEST_WIN_THRESHOLD = 3;
const REJECTION_LIMIT = 5;

/**
 * Check if either side has won via quest outcomes.
 * Good wins with 3 successes; Evil wins with 3 failures.
 * Returns undefined when no side has reached the threshold yet.
 */
export function checkQuestWinCondition(
  questResults: QuestResult[],
): AvalonWinner | undefined {
  const successes = questResults.filter((r) => r.succeeded).length;
  const failures = questResults.filter((r) => !r.succeeded).length;

  if (successes >= QUEST_WIN_THRESHOLD) return AvalonWinner.Good;
  if (failures >= QUEST_WIN_THRESHOLD) return AvalonWinner.Evil;
  return undefined;
}

/**
 * Check if Evil wins via 5 consecutive team vote rejections.
 * Returns Evil if the threshold is reached, undefined otherwise.
 */
export function checkRejectionWinCondition(
  consecutiveRejections: number,
): AvalonWinner | undefined {
  return consecutiveRejections >= REJECTION_LIMIT
    ? AvalonWinner.Evil
    : undefined;
}

/**
 * Determine the outcome of an assassination attempt.
 * Returns Evil if the target is Merlin, Good otherwise.
 */
export function checkAssassinationResult(
  targetPlayerId: string,
  roleAssignments: PlayerRoleAssignment[],
): AvalonWinner {
  const merlinId: string = AvalonRole.Merlin;
  const merlinAssignment = roleAssignments.find(
    (a) => a.roleDefinitionId === merlinId,
  );
  return merlinAssignment?.playerId === targetPlayerId
    ? AvalonWinner.Evil
    : AvalonWinner.Good;
}
