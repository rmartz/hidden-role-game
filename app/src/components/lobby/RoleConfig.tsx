import { sum } from "lodash";
import { useState } from "react";
import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import { RoleConfigMode } from "@/lib/types";
import type { RoleSlot } from "@/server/types";
import { useAppSelector } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleConfigEntry } from "./RoleConfigEntry";
import { RoleConfigModePicker } from "./RoleConfigModePicker";
import { ROLE_CONFIG_COPY } from "./copy";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  roleConfigMode: RoleConfigMode;
  playerCount: number;
  gameMode: GameMode;
  readOnly: true;
}

interface EditableProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  playerCount: number;
  roleConfigMode: RoleConfigMode;
  gameMode: GameMode;
  readOnly: false;
  disabled: boolean;
}

type RoleConfigProps = ReadOnlyProps | EditableProps;

export function RoleConfig(props: RoleConfigProps) {
  const { roleDefinitions, playerCount, gameMode, roleConfigMode, readOnly } =
    props;

  const [showAll, setShowAll] = useState(false);

  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);
  const roleMins = useAppSelector((s) => s.gameConfig.roleMins);
  const roleMaxes = useAppSelector((s) => s.gameConfig.roleMaxes);

  const isAdvanced = roleConfigMode === RoleConfigMode.Advanced;

  const readOnlyMin = readOnly
    ? Object.fromEntries((props.roleSlots ?? []).map((s) => [s.roleId, s.min]))
    : {};
  const readOnlyMax = readOnly
    ? Object.fromEntries((props.roleSlots ?? []).map((s) => [s.roleId, s.max]))
    : {};

  const total = readOnly ? 0 : sum(Object.values(roleCounts));

  const allRoles = Object.values(roleDefinitions);

  function isRoleEnabled(roleId: string): boolean {
    if (readOnly) return (readOnlyMax[roleId] ?? 0) > 0;
    if (roleConfigMode === RoleConfigMode.Advanced)
      return (roleMaxes[roleId] ?? 0) > 0;
    return (roleCounts[roleId] ?? 0) > 0;
  }

  const enabledRoles = allRoles.filter((r) => isRoleEnabled(r.id));
  const hasHiddenRoles = enabledRoles.length < allRoles.length;
  const visibleRoles =
    showAll || enabledRoles.length === 0 ? allRoles : enabledRoles;

  function toggleShowAll() {
    setShowAll((prev) => !prev);
  }

  return (
    <>
      {!readOnly && <RoleConfigModePicker disabled={props.disabled} />}
      <Card>
        <CardHeader>
          <CardTitle>Configure Roles</CardTitle>
          {!readOnly && (
            <p className="text-sm text-muted-foreground">
              {isAdvanced
                ? `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (min total: ${String(sum(Object.values(roleMins)))}, max total: ${String(sum(Object.values(roleMaxes)))})`
                : `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (${String(total)}/${String(playerCount)} assigned)`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 list-none p-0">
            {visibleRoles.map((role) =>
              readOnly ? (
                <RoleConfigEntry
                  key={role.id}
                  role={role}
                  gameMode={gameMode}
                  roleConfigMode={roleConfigMode}
                  min={readOnlyMin[role.id] ?? 0}
                  max={readOnlyMax[role.id] ?? 0}
                  readOnly={true}
                  dimmed={showAll && !isRoleEnabled(role.id)}
                />
              ) : (
                <RoleConfigEntry
                  key={role.id}
                  role={role}
                  gameMode={gameMode}
                  roleConfigMode={roleConfigMode}
                  readOnly={false}
                  disabled={props.disabled}
                  dimmed={showAll && !isRoleEnabled(role.id)}
                />
              ),
            )}
          </ul>
          {hasHiddenRoles && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={toggleShowAll}
            >
              {showAll
                ? ROLE_CONFIG_COPY.hideExtraRoles
                : ROLE_CONFIG_COPY.showAllRoles}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
