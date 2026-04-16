import { sum } from "lodash";
import { useState } from "react";
import type {
  AdvancedRoleBucket,
  GameMode,
  RoleBucket,
  RoleDefinition,
  Team,
} from "@/lib/types";
import { RoleConfigMode, isSimpleRoleBucket } from "@/lib/types";
import { useAppSelector } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleConfigEntry } from "./RoleConfigEntry";
import { RoleConfigModePicker } from "./RoleConfigModePicker";
import { RoleBucketConfig } from "./RoleBucketConfig";
import { ROLE_CONFIG_COPY } from "./RoleConfig.copy";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleBuckets?: RoleBucket[];
  roleConfigMode: RoleConfigMode;
  playerCount: number;
  gameMode: GameMode;
  readOnly: true;
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
}

interface EditableProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  playerCount: number;
  roleConfigMode: RoleConfigMode;
  gameMode: GameMode;
  readOnly: false;
  disabled: boolean;
  categoryOrder?: string[];
  categoryLabels?: Record<string, string>;
}

type RoleConfigProps = ReadOnlyProps | EditableProps;

export function RoleConfig(props: RoleConfigProps) {
  const { roleDefinitions, playerCount, gameMode, roleConfigMode, readOnly } =
    props;

  const [showAll, setShowAll] = useState(false);

  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);

  const isAdvanced = roleConfigMode === RoleConfigMode.Advanced;

  const readOnlyBuckets = readOnly ? (props.roleBuckets ?? []) : [];
  const readOnlyCounts = Object.fromEntries(
    readOnlyBuckets.flatMap((b) =>
      isSimpleRoleBucket(b) ? [[b.roleId, b.playerCount]] : [],
    ),
  );

  const total =
    !readOnly && roleConfigMode === RoleConfigMode.Custom
      ? sum(Object.values(roleCounts))
      : 0;

  const allRoles = Object.values(roleDefinitions);

  function isRoleEnabled(roleId: string): boolean {
    if (readOnly) return (readOnlyCounts[roleId] ?? 0) > 0;
    return (roleCounts[roleId] ?? 0) > 0;
  }

  const enabledRoles = allRoles.filter((r) => isRoleEnabled(r.id));
  const disabledRoles = allRoles.filter((r) => !isRoleEnabled(r.id));
  const hasHiddenRoles = disabledRoles.length > 0;

  const categoryOrder = props.categoryOrder;
  const categoryLabels = props.categoryLabels;
  const hasCategoryGrouping = !!categoryOrder;

  const disabledByCategory = hasCategoryGrouping
    ? categoryOrder.reduce<
        {
          category: string;
          label: string;
          roles: RoleDefinition<string, Team>[];
        }[]
      >((acc, cat) => {
        const roles = disabledRoles.filter((r) => r.category === cat);
        if (roles.length > 0) {
          acc.push({
            category: cat,
            label: categoryLabels?.[cat] ?? cat,
            roles,
          });
        }
        return acc;
      }, [])
    : [];

  const uncategorizedDisabled = hasCategoryGrouping
    ? disabledRoles.filter(
        (r) => !r.category || !categoryOrder.includes(r.category),
      )
    : disabledRoles;

  const topListRoles =
    showAll && !hasCategoryGrouping ? allRoles : enabledRoles;

  function toggleShowAll() {
    setShowAll((prev) => !prev);
  }

  return (
    <>
      {!readOnly && <RoleConfigModePicker disabled={props.disabled} />}
      <Card>
        <CardHeader>
          <CardTitle>Configure Roles</CardTitle>
          {!readOnly && !isAdvanced && (
            <p className="text-sm text-muted-foreground">
              {`Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (${String(total)}/${String(playerCount)} assigned)`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {!readOnly && isAdvanced && (
            <RoleBucketConfig
              roleDefinitions={roleDefinitions}
              gameMode={gameMode}
              disabled={props.disabled}
            />
          )}
          {readOnly && isAdvanced && (
            <ul className="space-y-3 list-none p-0">
              {readOnlyBuckets
                .filter((b): b is AdvancedRoleBucket => !isSimpleRoleBucket(b))
                .map((bucket, i) => (
                  <li key={i} className="border rounded-md p-3 space-y-1">
                    <p className="text-sm font-medium">
                      {bucket.name ?? ROLE_CONFIG_COPY.bucketLabel(i)}
                    </p>
                    <ul className="space-y-0.5 list-none p-0">
                      {bucket.roles.map((slot) => {
                        const roleDef = roleDefinitions[slot.roleId];
                        return (
                          <li
                            key={slot.roleId}
                            className="flex items-center gap-2"
                          >
                            {roleDef ? (
                              <RoleConfigEntry
                                role={roleDef}
                                gameMode={gameMode}
                                roleConfigMode={roleConfigMode}
                                count={slot.max ?? bucket.playerCount}
                                readOnly={true}
                              />
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {slot.roleId}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
            </ul>
          )}
          {!isAdvanced && (
            <>
              <ul className="space-y-1 list-none p-0">
                {topListRoles.map((role) =>
                  readOnly ? (
                    <RoleConfigEntry
                      key={role.id}
                      role={role}
                      gameMode={gameMode}
                      roleConfigMode={roleConfigMode}
                      count={readOnlyCounts[role.id] ?? 0}
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
                      dimmed={!hasCategoryGrouping && !isRoleEnabled(role.id)}
                    />
                  ),
                )}
              </ul>
              {hasCategoryGrouping && showAll && (
                <>
                  {disabledByCategory.map(({ category, label, roles }) => (
                    <div key={category} className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {label}
                      </p>
                      <ul className="space-y-1 list-none p-0">
                        {roles.map((role) =>
                          readOnly ? (
                            <RoleConfigEntry
                              key={role.id}
                              role={role}
                              gameMode={gameMode}
                              roleConfigMode={roleConfigMode}
                              count={readOnlyCounts[role.id] ?? 0}
                              readOnly={true}
                              dimmed
                            />
                          ) : (
                            <RoleConfigEntry
                              key={role.id}
                              role={role}
                              gameMode={gameMode}
                              roleConfigMode={roleConfigMode}
                              readOnly={false}
                              disabled={props.disabled}
                            />
                          ),
                        )}
                      </ul>
                    </div>
                  ))}
                  {uncategorizedDisabled.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Other
                      </p>
                      <ul className="space-y-1 list-none p-0">
                        {uncategorizedDisabled.map((role) =>
                          readOnly ? (
                            <RoleConfigEntry
                              key={role.id}
                              role={role}
                              gameMode={gameMode}
                              roleConfigMode={roleConfigMode}
                              count={readOnlyCounts[role.id] ?? 0}
                              readOnly={true}
                              dimmed
                            />
                          ) : (
                            <RoleConfigEntry
                              key={role.id}
                              role={role}
                              gameMode={gameMode}
                              roleConfigMode={roleConfigMode}
                              readOnly={false}
                              disabled={props.disabled}
                            />
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </>
              )}
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
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
