"use client";

import type { TimerConfig } from "@/lib/types";
import type { WerewolfTimerConfig } from "@/lib/game-modes/werewolf/timer-config";
import { TimerConfigPanel } from "./TimerConfigPanel";
import { WEREWOLF_TIMER_ROWS } from "./timer-rows";

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
      rows={WEREWOLF_TIMER_ROWS}
      disabled={disabled}
      onChange={onChange as ((config: TimerConfig) => void) | undefined}
    />
  );
}
