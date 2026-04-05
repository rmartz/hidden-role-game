"use client";

import type { ModeConfigField } from "@/lib/types";
import type { SecretVillainTimerConfig } from "@/lib/game-modes/secret-villain/timer-config";
import type { SecretVillainLobbyConfig } from "@/lib/game-modes/secret-villain/lobby-config";
import { SvBoardPreset } from "@/lib/game-modes/secret-villain/types";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
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

interface SecretVillainConfigPanelProps {
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainLobbyConfig["modeConfig"];
  disabled?: boolean;
  onTimerConfigChange?: (config: SecretVillainTimerConfig) => void;
  onModeConfigFieldChange?: (key: ModeConfigField, value: unknown) => void;
}

export function SecretVillainConfigPanel({
  timerConfig,
  modeConfig,
  disabled,
  onTimerConfigChange,
  onModeConfigFieldChange,
}: SecretVillainConfigPanelProps) {
  const currentPreset = modeConfig.boardPreset ?? "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="board-preset" className="text-sm min-w-[100px]">
          {SECRET_VILLAIN_CONFIG_PANEL_COPY.boardPresetLabel}
        </Label>
        <Select
          value={currentPreset}
          disabled={disabled ?? !onModeConfigFieldChange}
          onValueChange={(value) =>
            onModeConfigFieldChange?.("boardPreset", value as SvBoardPreset)
          }
        >
          <SelectTrigger id="board-preset" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SvBoardPreset).map((preset) => (
              <SelectItem key={preset} value={preset}>
                {SECRET_VILLAIN_COPY.boardPresets[preset]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SecretVillainTimerConfigPanel
        timerConfig={timerConfig}
        disabled={disabled}
        onChange={onTimerConfigChange}
      />
    </div>
  );
}
