"use client";

import type { TimerConfig } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WEREWOLF_CONFIG_PANEL_COPY } from "./WerewolfConfigPanel.copy";
import { TimerConfigPanel } from "./TimerConfigPanel";

interface WerewolfConfigPanelProps {
  timerConfig: TimerConfig;
  nominationEnabled: boolean;
  singleTrialPerDay: boolean;
  disabled?: boolean;
  onTimerConfigChange?: (config: TimerConfig) => void;
  onNominationEnabledChange?: (value: boolean) => void;
  onSingleTrialPerDayChange?: (value: boolean) => void;
}

export function WerewolfConfigPanel({
  timerConfig,
  nominationEnabled,
  singleTrialPerDay,
  disabled,
  onTimerConfigChange,
  onNominationEnabledChange,
  onSingleTrialPerDayChange,
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
      <div className="flex items-center gap-2">
        <Switch
          id="single-trial-per-day"
          checked={singleTrialPerDay}
          disabled={disabled ?? !onSingleTrialPerDayChange}
          onCheckedChange={onSingleTrialPerDayChange}
        />
        <Label htmlFor="single-trial-per-day">
          {WEREWOLF_CONFIG_PANEL_COPY.singleTrialPerDay}
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
