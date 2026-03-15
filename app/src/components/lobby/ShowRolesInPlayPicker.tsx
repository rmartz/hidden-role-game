"use client";

import { ShowRolesInPlay } from "@/lib/types";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const SHOW_ROLES_OPTIONS: {
  value: ShowRolesInPlay;
  title: string;
  description: string;
}[] = [
  {
    value: ShowRolesInPlay.None,
    title: "None",
    description:
      "Players cannot see which roles were configured for this game.",
  },
  {
    value: ShowRolesInPlay.ConfiguredOnly,
    title: "Configured only",
    description:
      "Players see which roles were configured, but not if they were assigned or how many are in play.",
  },
  {
    value: ShowRolesInPlay.AssignedRolesOnly,
    title: "Assigned roles",
    description:
      "Players see which roles were assigned, but not how many are in play.",
  },
  {
    value: ShowRolesInPlay.RoleAndCount,
    title: "Role and count",
    description:
      "Players see how many of each roles were assigned for the game.",
  },
];

interface ShowRolesInPlayPickerProps {
  value: ShowRolesInPlay;
  disabled?: boolean;
  onChange?: (value: ShowRolesInPlay) => void;
}

export function ShowRolesInPlayPicker({
  value,
  disabled,
  onChange,
}: ShowRolesInPlayPickerProps) {
  return (
    <div className="space-y-1">
      <Label>Show roles in play</Label>
      <RadioGroup
        value={value}
        disabled={disabled}
        onValueChange={(v) => {
          onChange?.(v as ShowRolesInPlay);
        }}
      >
        <FieldGroup className="gap-1.5">
          {SHOW_ROLES_OPTIONS.map((opt) => (
            <FieldLabel key={opt.value} htmlFor={opt.value}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{opt.title}</FieldTitle>
                  {opt.value === value && (
                    <FieldDescription>{opt.description}</FieldDescription>
                  )}
                </FieldContent>
                <RadioGroupItem value={opt.value} id={opt.value} />
              </Field>
            </FieldLabel>
          ))}
        </FieldGroup>
      </RadioGroup>
    </div>
  );
}
