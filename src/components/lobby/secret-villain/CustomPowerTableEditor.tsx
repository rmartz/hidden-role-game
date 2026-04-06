"use client";

import { SpecialActionType } from "@/lib/game-modes/secret-villain/types";
import type {
  SvCustomPowerConfig,
  SvCustomPowerSlot,
} from "@/lib/game-modes/secret-villain/types";
import { getSvThemeLabels } from "@/lib/game-modes/secret-villain/themes";
import type { SvTheme } from "@/lib/game-modes/secret-villain/themes";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECRET_VILLAIN_CONFIG_PANEL_COPY } from "./SecretVillainConfigPanel.copy";

/** Sentinel value for the "None" option in the power slot selector. */
const NONE_VALUE = "none";

interface CustomPowerTableEditorProps {
  powerTable: SvCustomPowerConfig;
  disabled?: boolean;
  onChange?: (table: SvCustomPowerConfig) => void;
  svTheme?: SvTheme;
}

const POWER_OPTIONS: { value: string; label: string }[] = [
  { value: NONE_VALUE, label: SECRET_VILLAIN_CONFIG_PANEL_COPY.powerNone },
  {
    value: SpecialActionType.InvestigateTeam,
    label: SECRET_VILLAIN_CONFIG_PANEL_COPY.powerInvestigateTeam,
  },
  {
    value: SpecialActionType.PolicyPeek,
    label: SECRET_VILLAIN_CONFIG_PANEL_COPY.powerPolicyPeek,
  },
  {
    value: SpecialActionType.SpecialElection,
    label: SECRET_VILLAIN_CONFIG_PANEL_COPY.powerSpecialElection,
  },
];

const POWER_LABELS: Record<string, string> = Object.fromEntries(
  POWER_OPTIONS.map((o) => [o.value, o.label]),
);

function toSelectValue(slot: SvCustomPowerSlot): string {
  return slot ?? NONE_VALUE;
}

function toSelectLabel(slot: SvCustomPowerSlot): string {
  return POWER_LABELS[slot ?? NONE_VALUE] ?? "";
}

function fromSelectValue(value: string): SvCustomPowerSlot {
  return value === NONE_VALUE ? undefined : (value as SvCustomPowerSlot);
}

export function CustomPowerTableEditor({
  powerTable,
  disabled,
  onChange,
  svTheme,
}: CustomPowerTableEditorProps) {
  const lockedLabel = `${getSvThemeLabels(svTheme).shootAction} (${SECRET_VILLAIN_CONFIG_PANEL_COPY.badCardSlotLocked})`;

  const handleSlotChange = (index: number, value: string | null) => {
    if (!value) return;
    const updated: SvCustomPowerConfig = [...powerTable];
    updated[index] = fromSelectValue(value);
    onChange?.(updated);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {SECRET_VILLAIN_CONFIG_PANEL_COPY.customBoardHeading}
      </p>
      {powerTable.map((slot, index) => (
        <div key={index} className="flex items-center gap-2">
          <Label className="text-sm min-w-[100px]">
            {SECRET_VILLAIN_CONFIG_PANEL_COPY.badCardSlotLabel(index + 1)}
          </Label>
          <Select
            value={toSelectValue(slot)}
            disabled={disabled ?? !onChange}
            onValueChange={(value) => {
              handleSlotChange(index, value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue>{toSelectLabel(slot)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {POWER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      {[4, 5].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <Label className="text-sm min-w-[100px]">
            {SECRET_VILLAIN_CONFIG_PANEL_COPY.badCardSlotLabel(n)}
          </Label>
          <span className="text-sm text-muted-foreground">{lockedLabel}</span>
        </div>
      ))}
    </div>
  );
}
