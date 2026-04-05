import { SpecialActionType, SvBoardPreset } from "../types";

/** Power table: actions triggered when the Nth Bad card is played (index 0 = 1st card). */
export type SvPowerTable = (SpecialActionType | undefined)[];

export const BOARD_PRESETS: Record<SvBoardPreset, SvPowerTable> = {
  [SvBoardPreset.Small]: [
    undefined, // 1st Bad card
    undefined, // 2nd Bad card
    SpecialActionType.PolicyPeek, // 3rd
    SpecialActionType.Shoot, // 4th
    SpecialActionType.Shoot, // 5th
  ],
  [SvBoardPreset.Medium]: [
    undefined, // 1st Bad card
    SpecialActionType.InvestigateTeam, // 2nd
    SpecialActionType.SpecialElection, // 3rd
    SpecialActionType.Shoot, // 4th
    SpecialActionType.Shoot, // 5th
  ],
  [SvBoardPreset.Large]: [
    SpecialActionType.InvestigateTeam, // 1st Bad card
    SpecialActionType.InvestigateTeam, // 2nd
    SpecialActionType.SpecialElection, // 3rd
    SpecialActionType.Shoot, // 4th
    SpecialActionType.Shoot, // 5th
  ],
};

/** Returns the recommended board preset for a given player count. */
export function getDefaultBoardPreset(playerCount: number): SvBoardPreset {
  if (playerCount <= 6) return SvBoardPreset.Small;
  if (playerCount <= 8) return SvBoardPreset.Medium;
  return SvBoardPreset.Large;
}

/**
 * Returns the special action triggered by playing the Nth Bad card,
 * or undefined if no action is triggered.
 *
 * @param badCardsPlayed — the count AFTER the card has been played (1-5)
 * @param preset — the board preset to use
 */
export function getSpecialAction(
  badCardsPlayed: number,
  preset: SvBoardPreset,
): SpecialActionType | undefined {
  return BOARD_PRESETS[preset][badCardsPlayed - 1];
}
