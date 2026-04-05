"use client";

import type { TimerConfig } from "@/lib/types";
import type { SecretVillainTimerConfig } from "@/lib/game-modes/secret-villain/timer-config";
import { TimerConfigPanel } from "./TimerConfigPanel";
import type { TimerRow } from "./TimerConfigPanelRow";
import { SECRET_VILLAIN_TIMER_CONFIG_PANEL_COPY } from "./SecretVillainTimerConfigPanel.copy";

const ROWS: TimerRow[] = [
  {
    label: SECRET_VILLAIN_TIMER_CONFIG_PANEL_COPY.startCountdown,
    field: "startCountdownSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
  {
    label: SECRET_VILLAIN_TIMER_CONFIG_PANEL_COPY.electionVote,
    field: "electionVoteSeconds",
    min: 15,
    max: 300,
    step: 15,
  },
];

interface SecretVillainTimerConfigPanelProps {
  timerConfig: SecretVillainTimerConfig;
  disabled?: boolean;
  onChange?: (config: SecretVillainTimerConfig) => void;
}

export function SecretVillainTimerConfigPanel({
  timerConfig,
  disabled,
  onChange,
}: SecretVillainTimerConfigPanelProps) {
  return (
    <TimerConfigPanel
      timerConfig={timerConfig}
      rows={ROWS}
      disabled={disabled}
      onChange={onChange as ((config: TimerConfig) => void) | undefined}
    />
  );
}
