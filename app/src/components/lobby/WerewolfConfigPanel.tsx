"use client";

import type { TimerConfig } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LOBBY_CONFIG_COPY } from "./copy";
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
          {LOBBY_CONFIG_COPY.nominationEnabled}
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
