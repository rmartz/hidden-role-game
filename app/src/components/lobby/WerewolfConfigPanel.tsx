"use client";

import type { TimerConfig } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WEREWOLF_CONFIG_PANEL_COPY } from "./WerewolfConfigPanel.copy";
import { TimerConfigPanel } from "./TimerConfigPanel";

interface WerewolfConfigPanelProps {
  timerConfig: TimerConfig;
  nominationEnabled: boolean;
  disabled?: boolean;
  onTimerConfigChange?: (config: TimerConfig) => void;
  onNominationEnabledChange?: (value: boolean) => void;
}

export function WerewolfConfigPanel({
  timerConfig,
  nominationEnabled,
  disabled,
  onTimerConfigChange,
  onNominationEnabledChange,
}: WerewolfConfigPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Switch
          id="nomination-enabled"
          checked={nominationEnabled}
          disabled={disabled ?? !onNominationEnabledChange}
          onCheckedChange={onNominationEnabledChange}
        />
        <Label htmlFor="nomination-enabled">
          {WEREWOLF_CONFIG_PANEL_COPY.nominationEnabled}
        </Label>
      </div>
      <TimerConfigPanel
        timerConfig={timerConfig}
        disabled={disabled}
        onChange={onTimerConfigChange}
      />
    </div>
  );
}
