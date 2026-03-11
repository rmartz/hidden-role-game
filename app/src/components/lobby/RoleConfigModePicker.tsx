"use client";

import { RoleConfigMode } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import { setRoleConfigMode } from "@/store/game-config-slice";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  disabled?: boolean;
}

export function RoleConfigModePicker({ disabled }: Props) {
  const dispatch = useAppDispatch();
  const roleConfigMode = useAppSelector((s) => s.gameConfig.roleConfigMode);

  return (
    <div className="space-y-1">
      <Label>Role configuration</Label>
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
