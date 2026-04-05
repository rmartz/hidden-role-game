import type { WerewolfModeConfig } from "@/lib/game-modes/werewolf/lobby-config";
import type { SecretVillainModeConfig } from "@/lib/game-modes/secret-villain/lobby-config";
import type { AvalonModeConfig } from "@/lib/game-modes/avalon/lobby-config";
import { GameMode } from "./game";

/**
 * Discriminated union of all game-mode-specific configurations.
 * Discriminant: `gameMode`.
 */
export type ModeConfig =
  | WerewolfModeConfig
  | SecretVillainModeConfig
  | AvalonModeConfig;

/** Narrow a ModeConfig to the Werewolf variant. */
export function isWerewolfModeConfig(
  config: ModeConfig,
): config is WerewolfModeConfig {
  return config.gameMode === GameMode.Werewolf;
}

/** Narrow a ModeConfig to the Secret Villain variant. */
export function isSecretVillainModeConfig(
  config: ModeConfig,
): config is SecretVillainModeConfig {
  return config.gameMode === GameMode.SecretVillain;
}
