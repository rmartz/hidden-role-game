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
import {
  SHOW_ROLES_IN_PLAY_PICKER_COPY,
  SHOW_ROLES_OPTIONS,
} from "./ShowRolesInPlayPicker.copy";

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
      <Label>{SHOW_ROLES_IN_PLAY_PICKER_COPY.label}</Label>
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
