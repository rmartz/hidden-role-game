export { createDeck, drawCards, reshuffleIfNeeded } from "./deck";
export {
  currentTurnState,
  getNextPresidentId,
  getEligibleChancellorIds,
} from "./turn-state";
export {
  BOARD_PRESETS,
  DEFAULT_CUSTOM_POWER_CONFIG,
  getDefaultBoardPreset,
  getSpecialAction,
  presetToCustomConfig,
  resolveCustomPowerTable,
  resolvePowerTable,
  type SvConcretePreset,
} from "./special-actions";
export {
  SecretVillainWinner,
  SvVictoryConditionKey,
  checkBoardWinCondition,
  checkShootWinCondition,
  checkChancellorElectionWinCondition,
} from "./win-condition";
