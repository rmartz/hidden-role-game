"use client";

import type { WerewolfTimerConfig } from "@/lib/game/modes/werewolf/timer-config";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { WEREWOLF_CONFIG_PANEL_COPY } from "./WerewolfConfigPanel.copy";
import { WerewolfTimerConfigPanel } from "./WerewolfTimerConfigPanel";
import { Incrementer } from "./Incrementer";
import type { IncrementDirection } from "./Incrementer";

interface WerewolfConfigPanelProps {
  timerConfig: WerewolfTimerConfig;
  nominationEnabled: boolean;
  trialsPerDay: number;
  revealProtections: boolean;
  disabled?: boolean;
  onWerewolfTimerConfigChange?: (config: WerewolfTimerConfig) => void;
  onNominationEnabledChange?: (value: boolean) => void;
  onTrialsPerDayChange?: (value: number) => void;
  onRevealProtectionsChange?: (value: boolean) => void;
}

export function WerewolfConfigPanel({
  timerConfig,
  nominationEnabled,
  trialsPerDay,
  revealProtections,
  disabled,
  onWerewolfTimerConfigChange,
  onNominationEnabledChange,
  onTrialsPerDayChange,
  onRevealProtectionsChange,
}: WerewolfConfigPanelProps) {
  function handleTrialsPerDayChange(direction: IncrementDirection) {
    if (!onTrialsPerDayChange) return;
    const next =
      direction === "increment" ? trialsPerDay + 1 : trialsPerDay - 1;
    onTrialsPerDayChange(Math.max(0, next));
  }

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
        <Incrementer
          value={trialsPerDay}
          minValue={0}
          maxValue={10}
          disabled={
            disabled === true || !onTrialsPerDayChange ? true : undefined
          }
          onChange={handleTrialsPerDayChange}
          zeroLabel={WEREWOLF_CONFIG_PANEL_COPY.trialsPerDayUnlimited}
        />
        <Label>{WEREWOLF_CONFIG_PANEL_COPY.trialsPerDay}</Label>
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
      <WerewolfTimerConfigPanel
        timerConfig={timerConfig}
        disabled={disabled}
        onChange={onWerewolfTimerConfigChange}
      />
    </div>
  );
}
