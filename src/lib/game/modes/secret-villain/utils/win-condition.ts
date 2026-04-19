import type { PlayerRoleAssignment } from "@/lib/types";
import type { SecretVillainTurnState } from "../types";
import {
  GOOD_CARDS_TO_WIN,
  BAD_CARDS_TO_WIN,
  BAD_CARDS_FOR_SPECIAL_BAD_WIN,
} from "../types";
import { SecretVillainRole } from "../roles";

export enum SecretVillainWinner {
  Good = "Good",
  Bad = "Bad",
}

/** Keys identifying which specific win condition triggered the end of a Secret Villain game. */
export enum SvVictoryConditionKey {
  GoodPolicy = "good-policy",
  BadPolicy = "bad-policy",
  SpecialBadElected = "special-bad-elected",
  GoodShoot = "good-shoot",
  Chaos = "chaos",
}

export interface WinConditionResult {
  winner: SecretVillainWinner;
}

/** Check board-based win conditions (5 Good or 6 Bad cards played). */
export function checkBoardWinCondition(
  ts: SecretVillainTurnState,
): WinConditionResult | undefined {
  if (ts.goodCardsPlayed >= GOOD_CARDS_TO_WIN) {
    return { winner: SecretVillainWinner.Good };
  }
  if (ts.badCardsPlayed >= BAD_CARDS_TO_WIN) {
    return { winner: SecretVillainWinner.Bad };
  }
  return undefined;
}

/** Check if Special Bad was eliminated (Good team wins). */
export function checkShootWinCondition(
  eliminatedPlayerId: string,
  roleAssignments: PlayerRoleAssignment[],
): WinConditionResult | undefined {
  const assignment = roleAssignments.find(
    (a) => a.playerId === eliminatedPlayerId,
  );
  if (assignment?.roleDefinitionId === SecretVillainRole.SpecialBad) {
    return { winner: SecretVillainWinner.Good };
  }
  return undefined;
}

/** Check if Special Bad was elected chancellor after enough Bad cards (Bad team wins). */
export function checkChancellorElectionWinCondition(
  chancellorId: string,
  roleAssignments: PlayerRoleAssignment[],
  badCardsPlayed: number,
): WinConditionResult | undefined {
  if (badCardsPlayed < BAD_CARDS_FOR_SPECIAL_BAD_WIN) return undefined;
  const assignment = roleAssignments.find((a) => a.playerId === chancellorId);
  if (assignment?.roleDefinitionId === SecretVillainRole.SpecialBad) {
    return { winner: SecretVillainWinner.Bad };
  }
  return undefined;
}
