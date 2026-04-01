"use client";

import { RoleConfigMode } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { setRoleConfigMode } from "@/store/game-config-slice";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROLE_CONFIG_MODE_PICKER_COPY } from "./RoleConfigModePicker.copy";

interface RoleConfigModePickerProps {
  disabled?: boolean;
}

export function RoleConfigModePicker({ disabled }: RoleConfigModePickerProps) {
  const dispatch = useAppDispatch();
  const roleConfigMode = useAppSelector((s) => s.gameConfig.roleConfigMode);

  return (
    <div className="space-y-1">
      <Label>{ROLE_CONFIG_MODE_PICKER_COPY.label}</Label>
      <Tabs
        value={roleConfigMode}
        onValueChange={(value) => {
          dispatch(setRoleConfigMode(value as RoleConfigMode));
        }}
      >
        <TabsList>
          {Object.values(RoleConfigMode).map((mode) => (
            <TabsTrigger key={mode} value={mode} disabled={disabled}>
              {mode}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
