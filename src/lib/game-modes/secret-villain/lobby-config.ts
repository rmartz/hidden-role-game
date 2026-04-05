import { GameMode } from "@/lib/types";
import type { LobbyConfig } from "@/lib/types";
import type { SecretVillainTimerConfig } from "./timer-config";
import { SpecialActionType, SvBoardPreset } from "./types";
import type { SvCustomPowerConfig, SvCustomPowerSlot } from "./types";

/** Secret Villain–specific mode configuration. */
export interface SecretVillainModeConfig {
  gameMode: GameMode.SecretVillain;
  /** Board preset that determines special action powers. */
  boardPreset?: SvBoardPreset;
  /** Custom power table for Bad cards #1–#3 (only used when boardPreset is Custom). */
  customPowerTable?: SvCustomPowerConfig;
}

/** Secret Villain–specific lobby configuration. */
export interface SecretVillainLobbyConfig extends LobbyConfig {
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainModeConfig;
}

export const DEFAULT_SECRET_VILLAIN_MODE_CONFIG: SecretVillainModeConfig = {
  gameMode: GameMode.SecretVillain,
};

const VALID_CUSTOM_SLOTS = new Set<string>([
  SpecialActionType.InvestigateTeam,
  SpecialActionType.PolicyPeek,
  SpecialActionType.SpecialElection,
]);

function parseCustomPowerSlot(value: unknown): SvCustomPowerSlot {
  if (typeof value === "string" && VALID_CUSTOM_SLOTS.has(value)) {
    return value as SvCustomPowerSlot;
  }
  return undefined;
}

/**
 * Parse a raw custom power table from Firebase. Firebase serializes `undefined`
 * array entries as `null`, so non-string values are normalized back to `undefined`.
 */
function parseCustomPowerTable(raw: unknown): SvCustomPowerConfig | undefined {
  if (!Array.isArray(raw) || raw.length < 3) return undefined;
  return [
    parseCustomPowerSlot(raw[0]),
    parseCustomPowerSlot(raw[1]),
    parseCustomPowerSlot(raw[2]),
  ];
}

export function parseSecretVillainModeConfig(
  raw: Record<string, unknown>,
): SecretVillainModeConfig {
  const boardPreset = raw["boardPreset"];
  const isValidPreset =
    typeof boardPreset === "string" &&
    Object.values(SvBoardPreset).includes(boardPreset as SvBoardPreset);

  const customPowerTable =
    isValidPreset && boardPreset === (SvBoardPreset.Custom as string)
      ? parseCustomPowerTable(raw["customPowerTable"])
      : undefined;

  return {
    gameMode: GameMode.SecretVillain,
    ...(isValidPreset ? { boardPreset: boardPreset as SvBoardPreset } : {}),
    ...(customPowerTable ? { customPowerTable } : {}),
  };
}
