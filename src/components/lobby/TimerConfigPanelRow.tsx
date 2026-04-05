"use client";

import { Incrementer } from "./Incrementer";

export interface TimerRow {
  label: string;
  field: string;
  min: number;
  max: number;
  step: number;
}

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

export function TimerConfigPanelRow({
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
