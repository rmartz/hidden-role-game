import { SpecialActionType } from "../types";

/**
 * Special action power tables indexed by badCardsPlayed count (1-5).
 * Each table maps to the action triggered when the Nth Bad card is played.
 * undefined = no special action for that card.
 */
const POWERS_5_6: (SpecialActionType | undefined)[] = [
  undefined, // 1st Bad card
  undefined, // 2nd Bad card
  SpecialActionType.InvestigateTeam, // 3rd
  SpecialActionType.Shoot, // 4th
  SpecialActionType.Shoot, // 5th
];

const POWERS_7_8: (SpecialActionType | undefined)[] = [
  undefined, // 1st Bad card
  SpecialActionType.InvestigateTeam, // 2nd
  SpecialActionType.SpecialElection, // 3rd
  SpecialActionType.Shoot, // 4th
  SpecialActionType.Shoot, // 5th
];

const POWERS_9_10: (SpecialActionType | undefined)[] = [
  SpecialActionType.InvestigateTeam, // 1st Bad card
  SpecialActionType.InvestigateTeam, // 2nd
  SpecialActionType.SpecialElection, // 3rd
  SpecialActionType.Shoot, // 4th
  SpecialActionType.Shoot, // 5th
];

/**
 * Returns the special action triggered by playing the Nth Bad card,
 * or undefined if no action is triggered.
 *
 * @param badCardsPlayed — the count AFTER the card has been played (1-5)
 * @param playerCount — total players in the game (including eliminated)
 */
export function getSpecialAction(
  badCardsPlayed: number,
  playerCount: number,
): SpecialActionType | undefined {
  const powers =
    playerCount <= 6 ? POWERS_5_6 : playerCount <= 8 ? POWERS_7_8 : POWERS_9_10;
  return powers[badCardsPlayed - 1];
}
