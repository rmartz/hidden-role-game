"use client";

import type { ModeConfigField } from "@/lib/types";
import type { SecretVillainTimerConfig } from "@/lib/game-modes/secret-villain/timer-config";
import type { SecretVillainLobbyConfig } from "@/lib/game-modes/secret-villain/lobby-config";
import { SvBoardPreset } from "@/lib/game-modes/secret-villain/types";
import type { SvCustomPowerConfig } from "@/lib/game-modes/secret-villain/types";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import {
  getDefaultBoardPreset,
  presetToCustomConfig,
  type SvConcretePreset,
} from "@/lib/game-modes/secret-villain/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecretVillainTimerConfigPanel } from "./SecretVillainTimerConfigPanel";
import { SECRET_VILLAIN_CONFIG_PANEL_COPY } from "./SecretVillainConfigPanel.copy";
import { CustomPowerTableEditor } from "./CustomPowerTableEditor";

/** Display order for the board preset dropdown. */
const PRESET_DISPLAY_ORDER: SvBoardPreset[] = [
  SvBoardPreset.Default,
  SvBoardPreset.Small,
  SvBoardPreset.Medium,
  SvBoardPreset.Large,
  SvBoardPreset.Custom,
];

interface SecretVillainConfigPanelProps {
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainLobbyConfig["modeConfig"];
  playerCount: number;
  disabled?: boolean;
  onTimerConfigChange?: (config: SecretVillainTimerConfig) => void;
  onModeConfigFieldChange?: (key: ModeConfigField, value: unknown) => void;
}

export function SecretVillainConfigPanel({
  timerConfig,
  modeConfig,
  playerCount,
  disabled,
  onTimerConfigChange,
  onModeConfigFieldChange,
}: SecretVillainConfigPanelProps) {
  const currentPreset = modeConfig.boardPreset ?? "";
  const isCustom = currentPreset === SvBoardPreset.Custom;
  const presetLabel =
    currentPreset === "" ? "" : SECRET_VILLAIN_COPY.boardPresets[currentPreset];

  const previousConcretePreset: SvConcretePreset =
    currentPreset !== "" &&
    currentPreset !== SvBoardPreset.Custom &&
    currentPreset !== SvBoardPreset.Default
      ? (currentPreset as SvConcretePreset)
      : getDefaultBoardPreset(playerCount);

  const customPowerTable: SvCustomPowerConfig =
    modeConfig.customPowerTable ?? presetToCustomConfig(previousConcretePreset);

  const handlePresetChange = (value: string | null) => {
    if (!value) return;
    onModeConfigFieldChange?.("boardPreset", value as SvBoardPreset);
    if (
      value === (SvBoardPreset.Custom as string) &&
      !modeConfig.customPowerTable
    ) {
      onModeConfigFieldChange?.(
        "customPowerTable",
        presetToCustomConfig(previousConcretePreset),
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="board-preset" className="text-sm min-w-[100px]">
          {SECRET_VILLAIN_CONFIG_PANEL_COPY.boardPresetLabel}
        </Label>
        <Select
          value={currentPreset}
          disabled={disabled ?? !onModeConfigFieldChange}
          onValueChange={handlePresetChange}
        >
          <SelectTrigger id="board-preset" className="w-[180px]">
            <SelectValue>{presetLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRESET_DISPLAY_ORDER.map((preset) => (
              <SelectItem key={preset} value={preset}>
                {SECRET_VILLAIN_COPY.boardPresets[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isCustom && (
        <CustomPowerTableEditor
          powerTable={customPowerTable}
          disabled={disabled}
          onChange={
            onModeConfigFieldChange
              ? (table) => {
                  onModeConfigFieldChange("customPowerTable", table);
                }
              : undefined
          }
        />
      )}
      <SecretVillainTimerConfigPanel
        timerConfig={timerConfig}
        disabled={disabled}
        onChange={onTimerConfigChange}
      />
    </div>
  );
}
