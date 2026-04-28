import { SpecialActionType, SvBoardPreset } from "../types";
import type { SvCustomPowerConfig, SvPowerTable } from "../types";

/** Concrete preset type — excludes virtual presets (Custom, Default). */
export type SvConcretePreset = Exclude<
  SvBoardPreset,
  SvBoardPreset.Custom | SvBoardPreset.Default
>;

export const BOARD_PRESETS: Record<SvConcretePreset, SvPowerTable> = {
  [SvBoardPreset.Large]: [
    SpecialActionType.InvestigateTeam, // 1st Bad card
    SpecialActionType.InvestigateTeam, // 2nd
    SpecialActionType.SpecialElection, // 3rd
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
  [SvBoardPreset.Small]: [
    undefined, // 1st Bad card
    undefined, // 2nd Bad card
    SpecialActionType.PolicyPeek, // 3rd
    SpecialActionType.Shoot, // 4th
    SpecialActionType.Shoot, // 5th
  ],
};

/** Default custom power config: no powers for cards #1–#3. */
export const DEFAULT_CUSTOM_POWER_CONFIG: SvCustomPowerConfig = [
  undefined,
  undefined,
  undefined,
];

/** Returns the recommended board preset for a given player count. */
export function getDefaultBoardPreset(playerCount: number): SvConcretePreset {
  if (playerCount <= 6) return SvBoardPreset.Small;
  if (playerCount <= 8) return SvBoardPreset.Medium;
  return SvBoardPreset.Large;
}

/** Expand a 3-slot custom config into a full 5-slot power table (cards #4-#5 locked to Shoot). */
export function resolveCustomPowerTable(
  config: SvCustomPowerConfig,
): SvPowerTable {
  return [...config, SpecialActionType.Shoot, SpecialActionType.Shoot];
}

/** Resolve a board preset (or custom config) into a full 5-slot power table. */
export function resolvePowerTable(
  preset: SvBoardPreset,
  customPowerTable?: SvCustomPowerConfig,
  playerCount?: number,
): SvPowerTable {
  if (preset === SvBoardPreset.Custom) {
    return resolveCustomPowerTable(
      customPowerTable ?? DEFAULT_CUSTOM_POWER_CONFIG,
    );
  }
  const concrete =
    preset === SvBoardPreset.Default
      ? getDefaultBoardPreset(playerCount ?? 5)
      : preset;
  return BOARD_PRESETS[concrete];
}

/** Extract the configurable portion (cards #1–#3) from a preset's power table. */
export function presetToCustomConfig(
  preset: SvConcretePreset,
): SvCustomPowerConfig {
  const table = BOARD_PRESETS[preset];
  return [
    table[0] as SvCustomPowerConfig[0],
    table[1] as SvCustomPowerConfig[1],
    table[2] as SvCustomPowerConfig[2],
  ];
}

/**
 * Returns the special action triggered by playing the Nth Bad card,
 * or undefined if no action is triggered.
 *
 * @param badCardsPlayed — the count AFTER the card has been played (1-5)
 * @param powerTable — the resolved power table for this game
 */
export function getSpecialAction(
  badCardsPlayed: number,
  powerTable: SvPowerTable,
): SpecialActionType | undefined {
  return powerTable[badCardsPlayed - 1];
}
