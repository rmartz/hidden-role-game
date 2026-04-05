"use client";

import type { TimerConfig } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TIMER_CONFIG_COPY } from "./TimerConfigPanel.copy";
import { TimerConfigPanelRow } from "./TimerConfigPanelRow";
import type { TimerRow } from "./TimerConfigPanelRow";

interface TimerConfigPanelProps {
  timerConfig: TimerConfig;
  rows: TimerRow[];
  disabled?: boolean;
  onChange?: (config: TimerConfig) => void;
}

export function TimerConfigPanel({
  timerConfig,
  rows,
  disabled,
  onChange,
}: TimerConfigPanelProps) {
  const readOnly = !onChange;
  const config = timerConfig as unknown as Record<string, unknown>;

  function handleAutoAdvanceChange(checked: boolean) {
    onChange?.({ ...timerConfig, autoAdvance: checked });
  }

  function handleIncrement(
    row: TimerRow,
    direction: "increment" | "decrement",
  ) {
    if (!onChange) return;
    const current = config[row.field] as number;
    const next =
      direction === "increment"
        ? Math.min(row.max, current + row.step)
        : Math.max(row.min, current - row.step);
    onChange({ ...timerConfig, [row.field]: next } as TimerConfig);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{TIMER_CONFIG_COPY.heading}</p>
      <div className="flex items-center gap-2">
        <Switch
          id="timer-auto-advance"
          checked={timerConfig.autoAdvance}
          disabled={disabled ?? readOnly}
          onCheckedChange={handleAutoAdvanceChange}
        />
        <Label htmlFor="timer-auto-advance" className="text-sm">
          {TIMER_CONFIG_COPY.autoAdvance}
        </Label>
      </div>
      {rows.map((row) => (
        <TimerConfigPanelRow
          key={row.field}
          row={row}
          value={config[row.field] as number}
          readOnly={readOnly}
          disabled={disabled ?? false}
          onIncrement={handleIncrement}
        />
      ))}
    </div>
  );
}
