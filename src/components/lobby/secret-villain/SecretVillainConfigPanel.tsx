"use client";

import type { ModeConfigField } from "@/lib/types";
import type { SecretVillainTimerConfig } from "@/lib/game-modes/secret-villain/timer-config";
import type { SecretVillainModeConfig } from "@/lib/game-modes/secret-villain/lobby-config";
import type { SecretVillainLobbyConfig } from "@/lib/game-modes/secret-villain/lobby-config";
import { SvBoardPreset } from "@/lib/game-modes/secret-villain/types";
import { SvTheme, SV_THEMES } from "@/lib/game-modes/secret-villain/themes";
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

function getPresetLabel(preset: SvBoardPreset, playerCount: number): string {
  if (preset !== SvBoardPreset.Default) {
    return SECRET_VILLAIN_COPY.boardPresets[preset];
  }
  const resolved = getDefaultBoardPreset(playerCount);
  const resolvedLabel = SECRET_VILLAIN_COPY.boardPresets[resolved];
  return `${SECRET_VILLAIN_COPY.boardPresets[SvBoardPreset.Default]} (${resolvedLabel})`;
}

interface SecretVillainConfigPanelProps {
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainLobbyConfig["modeConfig"];
  playerCount: number;
  disabled?: boolean;
  onTimerConfigChange?: (config: SecretVillainTimerConfig) => void;
  onModeConfigFieldChange?: (key: ModeConfigField, value: unknown) => void;
  onModeConfigChange?: (config: SecretVillainModeConfig) => void;
}

export function SecretVillainConfigPanel({
  timerConfig,
  modeConfig,
  playerCount,
  disabled,
  onTimerConfigChange,
  onModeConfigFieldChange,
  onModeConfigChange,
}: SecretVillainConfigPanelProps) {
  const currentPreset = modeConfig.boardPreset ?? SvBoardPreset.Default;
  const isCustom = currentPreset === SvBoardPreset.Custom;
  const presetLabel = getPresetLabel(currentPreset, playerCount);

  const previousConcretePreset: SvConcretePreset =
    currentPreset !== SvBoardPreset.Custom &&
    currentPreset !== SvBoardPreset.Default
      ? (currentPreset as SvConcretePreset)
      : getDefaultBoardPreset(playerCount);

  const customPowerTable: SvCustomPowerConfig =
    modeConfig.customPowerTable ?? presetToCustomConfig(previousConcretePreset);

  const handlePresetChange = (value: string | null) => {
    if (!value) return;
    const newPreset = value as SvBoardPreset;
    if (
      newPreset === SvBoardPreset.Custom &&
      !modeConfig.customPowerTable &&
      onModeConfigChange
    ) {
      onModeConfigChange({
        ...modeConfig,
        boardPreset: SvBoardPreset.Custom,
        customPowerTable: presetToCustomConfig(previousConcretePreset),
      });
      return;
    }
    onModeConfigFieldChange?.("boardPreset", newPreset);
  };

  const currentTheme = modeConfig.theme ?? SvTheme.Default;
  const themeLabel = SV_THEMES[currentTheme].name;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="sv-theme" className="text-sm min-w-[100px]">
          {SECRET_VILLAIN_CONFIG_PANEL_COPY.themeLabel}
        </Label>
        <Select
          value={currentTheme}
          disabled={disabled ?? !onModeConfigFieldChange}
          onValueChange={(value: string | null) => {
            if (value) onModeConfigFieldChange?.("theme", value as SvTheme);
          }}
        >
          <SelectTrigger id="sv-theme" className="w-[180px]">
            <SelectValue>{themeLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.values(SvTheme).map((t) => (
              <SelectItem key={t} value={t}>
                {SV_THEMES[t].name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
                {getPresetLabel(preset, playerCount)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isCustom && (
        <CustomPowerTableEditor
          powerTable={customPowerTable}
          disabled={disabled}
          svTheme={currentTheme}
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
