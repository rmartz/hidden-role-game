"use client";

import type { TimerConfig } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Incrementer } from "./Incrementer";

interface TimerRow {
  label: string;
  field: keyof TimerConfig;
  defaultSeconds: number;
  min: number;
  max: number;
  step: number;
}

const TIMER_ROWS: TimerRow[] = [
  {
    label: "Start countdown",
    field: "startCountdownSeconds",
    defaultSeconds: 10,
    min: 5,
    max: 60,
    step: 5,
  },
  {
    label: "Night phase (per role)",
    field: "nightPhaseSeconds",
    defaultSeconds: 30,
    min: 10,
    max: 120,
    step: 5,
  },
  {
    label: "Day discussion",
    field: "dayPhaseSeconds",
    defaultSeconds: 300,
    min: 30,
    max: 900,
    step: 30,
  },
  {
    label: "Voting phase",
    field: "votePhaseSeconds",
    defaultSeconds: 20,
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

interface Props {
  timerConfig?: TimerConfig;
  disabled?: boolean;
  onChange?: (config: TimerConfig | undefined) => void;
}

export function TimerConfigPanel({ timerConfig, disabled, onChange }: Props) {
  const readOnly = !onChange;

  function handleToggle(row: TimerRow, enabled: boolean) {
    if (!onChange) return;
    const current = timerConfig ?? {};
    onChange({
      ...current,
      [row.field]: enabled ? row.defaultSeconds : undefined,
    });
  }

  function handleIncrement(
    row: TimerRow,
    direction: "increment" | "decrement",
  ) {
    if (!onChange || !timerConfig) return;
    const currentValue = timerConfig[row.field];
    if (currentValue === undefined) return;
    const newValue =
      direction === "increment"
        ? Math.min(row.max, currentValue + row.step)
        : Math.max(row.min, currentValue - row.step);
    onChange({ ...timerConfig, [row.field]: newValue });
  }

  const enrichedRows = TIMER_ROWS.map((row) => {
    const value = timerConfig?.[row.field] ?? null;
    return value !== null
      ? { ...row, value, isEnabled: true as const }
      : { ...row, value: null, isEnabled: false as const };
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Phase Timers</p>
      {enrichedRows.map((row) => (
        <div key={row.field} className="flex items-center gap-3">
          <Switch
            id={`timer-${row.field}`}
            checked={row.isEnabled}
            disabled={disabled ?? readOnly}
            onCheckedChange={(checked) => {
              handleToggle(row, checked);
            }}
          />
          <Label
            htmlFor={`timer-${row.field}`}
            className="text-sm min-w-[140px]"
          >
            {row.label}
          </Label>
          {row.isEnabled && (
            <div className="flex items-center gap-1">
              {readOnly || disabled ? (
                <span className="text-sm text-muted-foreground">
                  {formatDuration(row.value)}
                </span>
              ) : (
                <>
                  <Incrementer
                    value={row.value}
                    onChange={(dir) => {
                      handleIncrement(row, dir);
                    }}
                    minValue={row.min}
                    maxValue={row.max}
                  />
                  <span className="text-xs text-muted-foreground ml-1">
                    {formatDuration(row.value)}
                  </span>
                </>
              )}
            </div>
          )}
          {!row.isEnabled && (
            <span className="text-xs text-muted-foreground">Manual</span>
          )}
        </div>
      ))}
    </div>
  );
}
