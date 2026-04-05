import { GameMode } from "@/lib/types";
import type { LobbyConfig } from "@/lib/types";
import type { SecretVillainTimerConfig } from "./timer-config";
import { SvBoardPreset } from "./types";

/** Secret Villain–specific mode configuration. */
export interface SecretVillainModeConfig {
  gameMode: GameMode.SecretVillain;
  /** Board preset that determines special action powers. */
  boardPreset?: SvBoardPreset;
}

/** Secret Villain–specific lobby configuration. */
export interface SecretVillainLobbyConfig extends LobbyConfig {
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainModeConfig;
}

export const DEFAULT_SECRET_VILLAIN_MODE_CONFIG: SecretVillainModeConfig = {
  gameMode: GameMode.SecretVillain,
};

export function parseSecretVillainModeConfig(
  raw: Record<string, unknown>,
): SecretVillainModeConfig {
  const boardPreset = raw["boardPreset"];
  return {
    gameMode: GameMode.SecretVillain,
    ...(typeof boardPreset === "string" &&
    Object.values(SvBoardPreset).includes(boardPreset as SvBoardPreset)
      ? { boardPreset: boardPreset as SvBoardPreset }
      : {}),
  };
}
