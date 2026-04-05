"use client";

import type { TimerConfig } from "@/lib/types";
import type { SecretVillainTimerConfig } from "@/lib/game-modes/secret-villain/timer-config";
import { TimerConfigPanel } from "./TimerConfigPanel";
import { SECRET_VILLAIN_TIMER_ROWS } from "./timer-rows";

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
      rows={SECRET_VILLAIN_TIMER_ROWS}
      disabled={disabled}
      onChange={onChange as ((config: TimerConfig) => void) | undefined}
    />
  );
}
