import type { PlayerRoleAssignment } from "@/lib/types";

import { SecretVillainRole } from "../roles";
import type { SecretVillainTurnState } from "../types";
import {
  BAD_CARDS_FOR_SPECIAL_BAD_WIN,
  BAD_CARDS_TO_WIN,
  GOOD_CARDS_TO_WIN,
} from "../types";

export enum SecretVillainWinner {
  Bad = "Bad",
  Good = "Good",
}

/** Keys identifying which specific win condition triggered the end of a Secret Villain game. */
export enum SvVictoryConditionKey {
  BadPolicy = "bad-policy",
  Chaos = "chaos",
  GoodPolicy = "good-policy",
  GoodShoot = "good-shoot",
  SpecialBadElected = "special-bad-elected",
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
