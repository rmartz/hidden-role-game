"use client";

import type { TimerConfig } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TIMER_CONFIG_COPY } from "./copy";
import { TimerConfigPanelRow, TIMER_ROWS } from "./TimerConfigPanelRow";
import type { TimerRow } from "./TimerConfigPanelRow";

interface TimerConfigPanelProps {
  timerConfig: TimerConfig;
  disabled?: boolean;
  onChange?: (config: TimerConfig) => void;
}

export function TimerConfigPanel({
  timerConfig,
  disabled,
  onChange,
}: TimerConfigPanelProps) {
  const readOnly = !onChange;

  function handleAutoAdvanceChange(checked: boolean) {
    onChange?.({ ...timerConfig, autoAdvance: checked });
  }

  function handleIncrement(
    row: TimerRow,
    direction: "increment" | "decrement",
  ) {
    if (!onChange) return;
    const current = timerConfig[row.field];
    const next =
      direction === "increment"
        ? Math.min(row.max, current + row.step)
        : Math.max(row.min, current - row.step);
    onChange({ ...timerConfig, [row.field]: next });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{TIMER_CONFIG_COPY.heading}</p>
      <div className="flex items-center gap-2">
        <Checkbox
          id="timer-auto-advance"
          checked={timerConfig.autoAdvance}
          disabled={disabled ?? readOnly}
          onCheckedChange={(checked) => {
            handleAutoAdvanceChange(checked);
          }}
        />
        <Label htmlFor="timer-auto-advance" className="text-sm">
          {TIMER_CONFIG_COPY.autoAdvance}
        </Label>
      </div>
      {TIMER_ROWS.map((row) => (
        <TimerConfigPanelRow
          key={row.field}
          row={row}
          value={timerConfig[row.field]}
          readOnly={readOnly}
          disabled={disabled ?? false}
          onIncrement={handleIncrement}
        />
      ))}
    </div>
  );
}
