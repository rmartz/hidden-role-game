"use client";

import type { TimerConfig } from "@/lib/types";
import type { WerewolfTimerConfig } from "@/lib/game-modes/werewolf/timer-config";
import { TimerConfigPanel } from "./TimerConfigPanel";
import type { TimerRow } from "./TimerConfigPanelRow";
import { WEREWOLF_TIMER_CONFIG_PANEL_COPY } from "./WerewolfTimerConfigPanel.copy";

const ROWS: TimerRow[] = [
  {
    label: WEREWOLF_TIMER_CONFIG_PANEL_COPY.startCountdown,
    field: "startCountdownSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
  {
    label: WEREWOLF_TIMER_CONFIG_PANEL_COPY.nightPhase,
    field: "nightPhaseSeconds",
    min: 10,
    max: 120,
    step: 5,
  },
  {
    label: WEREWOLF_TIMER_CONFIG_PANEL_COPY.dayDiscussion,
    field: "dayPhaseSeconds",
    min: 30,
    max: 900,
    step: 30,
  },
  {
    label: WEREWOLF_TIMER_CONFIG_PANEL_COPY.votingPhase,
    field: "votePhaseSeconds",
    min: 15,
    max: 300,
    step: 15,
  },
  {
    label: WEREWOLF_TIMER_CONFIG_PANEL_COPY.defensePhase,
    field: "defensePhaseSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
];

interface WerewolfTimerConfigPanelProps {
  timerConfig: WerewolfTimerConfig;
  disabled?: boolean;
  onChange?: (config: WerewolfTimerConfig) => void;
}

export function WerewolfTimerConfigPanel({
  timerConfig,
  disabled,
  onChange,
}: WerewolfTimerConfigPanelProps) {
  return (
    <TimerConfigPanel
      timerConfig={timerConfig}
      rows={ROWS}
      disabled={disabled}
      onChange={onChange as ((config: TimerConfig) => void) | undefined}
    />
  );
}
