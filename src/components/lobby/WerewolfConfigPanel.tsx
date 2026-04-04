"use client";

import type { WerewolfTimerConfig } from "@/lib/game-modes/werewolf/timer-config";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WEREWOLF_CONFIG_PANEL_COPY } from "./WerewolfConfigPanel.copy";
import { TimerConfigPanel } from "./TimerConfigPanel";

interface WerewolfConfigPanelProps {
  timerConfig: WerewolfTimerConfig;
  nominationEnabled: boolean;
  singleTrialPerDay: boolean;
  revealProtections: boolean;
  disabled?: boolean;
  onWerewolfTimerConfigChange?: (config: WerewolfTimerConfig) => void;
  onNominationEnabledChange?: (value: boolean) => void;
  onSingleTrialPerDayChange?: (value: boolean) => void;
  onRevealProtectionsChange?: (value: boolean) => void;
}

export function WerewolfConfigPanel({
  timerConfig,
  nominationEnabled,
  singleTrialPerDay,
  revealProtections,
  disabled,
  onWerewolfTimerConfigChange,
  onNominationEnabledChange,
  onSingleTrialPerDayChange,
  onRevealProtectionsChange,
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
      <div className="flex items-center gap-2">
        <Switch
          id="reveal-protections"
          checked={revealProtections}
          disabled={disabled ?? !onRevealProtectionsChange}
          onCheckedChange={onRevealProtectionsChange}
        />
        <Label htmlFor="reveal-protections">
          {WEREWOLF_CONFIG_PANEL_COPY.revealProtections}
        </Label>
      </div>
      <TimerConfigPanel
        timerConfig={timerConfig}
        disabled={disabled}
        onChange={onWerewolfTimerConfigChange}
      />
    </div>
  );
}
