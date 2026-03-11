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
    description: "Players cannot see which roles are in the game.",
  },
  {
    value: ShowRolesInPlay.ConfiguredOnly,
    title: "Configured only",
    description:
      "Players see what roles that could be in the game, without counts.",
  },
  {
    value: ShowRolesInPlay.AssignedRolesOnly,
    title: "Assigned roles",
    description: "Players see only the roles that were actually assigned.",
  },
  {
    value: ShowRolesInPlay.RoleAndCount,
    title: "Role and count",
    description: "Players see each role and how many copies are in play.",
  },
];

interface Props {
  value: ShowRolesInPlay;
  disabled?: boolean;
  onChange?: (value: ShowRolesInPlay) => void;
}

export function ShowRolesInPlayPicker({ value, disabled, onChange }: Props) {
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
        <FieldGroup>
          {SHOW_ROLES_OPTIONS.map((opt) => (
            <FieldLabel key={opt.value} htmlFor={opt.value}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{opt.title}</FieldTitle>
                  <FieldDescription>{opt.description}</FieldDescription>
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
