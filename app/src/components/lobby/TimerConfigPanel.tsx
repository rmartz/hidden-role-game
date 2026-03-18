"use client";

import type { TimerConfig } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Incrementer } from "./Incrementer";
import { TIMER_CONFIG_COPY } from "./copy";

interface TimerRow {
  label: string;
  field: keyof Omit<TimerConfig, "autoAdvance">;
  min: number;
  max: number;
  step: number;
}

const TIMER_ROWS: TimerRow[] = [
  {
    label: TIMER_CONFIG_COPY.startCountdown,
    field: "startCountdownSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
  {
    label: TIMER_CONFIG_COPY.nightPhase,
    field: "nightPhaseSeconds",
    min: 10,
    max: 120,
    step: 5,
  },
  {
    label: TIMER_CONFIG_COPY.dayDiscussion,
    field: "dayPhaseSeconds",
    min: 30,
    max: 900,
    step: 30,
  },
  {
    label: TIMER_CONFIG_COPY.votingPhase,
    field: "votePhaseSeconds",
    min: 15,
    max: 300,
    step: 15,
  },
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${String(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${String(m)}m ${String(s)}s` : `${String(m)}m`;
}

interface TimerConfigPanelRowProps {
  row: TimerRow;
  value: number;
  readOnly: boolean;
  disabled: boolean;
  onIncrement: (row: TimerRow, direction: "increment" | "decrement") => void;
}

function TimerConfigPanelRow({
  row,
  value,
  readOnly,
  disabled,
  onIncrement,
}: TimerConfigPanelRowProps) {
  const displayValue =
    readOnly || disabled ? (
      <span className="text-sm text-muted-foreground">
        {formatDuration(value)}
      </span>
    ) : (
      <>
        <Incrementer
          value={value}
          onChange={(dir) => {
            onIncrement(row, dir);
          }}
          minValue={row.min}
          maxValue={row.max}
        />
        <span className="text-xs text-muted-foreground ml-1">
          {formatDuration(value)}
        </span>
      </>
    );

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground min-w-[140px]">
        {row.label}
      </span>
      <div className="flex items-center gap-1">{displayValue}</div>
    </div>
  );
}

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
