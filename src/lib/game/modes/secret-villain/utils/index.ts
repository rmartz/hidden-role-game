export { createDeck, drawCards, reshuffleIfNeeded } from "./deck";
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
  currentTurnState,
  getEligibleChancellorIds,
  getNextPresidentId,
} from "./turn-state";
export {
  checkBoardWinCondition,
  checkChancellorElectionWinCondition,
  checkShootWinCondition,
  SecretVillainWinner,
  SvVictoryConditionKey,
} from "./win-condition";
