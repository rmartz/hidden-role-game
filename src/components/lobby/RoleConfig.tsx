import { sum } from "lodash";
import { useState } from "react";
import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import { RoleConfigMode } from "@/lib/types";
import type { RoleSlot } from "@/server/types";
import { useAppSelector } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleConfigEntry } from "./RoleConfigEntry";
import { RoleConfigModePicker } from "./RoleConfigModePicker";
import { ROLE_CONFIG_COPY } from "./RoleConfig.copy";
import { searchRoles } from "./searchRoles";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const categoryOrder = props.categoryOrder;
  const categoryLabels = props.categoryLabels;
  const hasCategoryGrouping = !!categoryOrder;

  const isSearching = searchQuery.trim() !== "";

  const searchedRoles = isSearching
    ? searchRoles(allRoles, searchQuery, { categoryLabels })
    : allRoles;

  const enabledRoles = searchedRoles.filter((r) => isRoleEnabled(r.id));
  const disabledRoles = searchedRoles.filter((r) => !isRoleEnabled(r.id));
  const hasHiddenRoles = !isSearching && disabledRoles.length > 0;

  const disabledByCategory =
    hasCategoryGrouping && !isSearching
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

  const uncategorizedDisabled =
    hasCategoryGrouping && !isSearching
      ? disabledRoles.filter(
          (r) => !r.category || !categoryOrder.includes(r.category),
        )
      : [];

  const topListRoles = isSearching
    ? searchedRoles
    : showAll && !hasCategoryGrouping
      ? allRoles
      : enabledRoles;

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
          <Input
            type="search"
            placeholder={ROLE_CONFIG_COPY.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="mt-1"
          />
        </CardHeader>
        <CardContent>
          {isSearching && searchedRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {ROLE_CONFIG_COPY.noSearchResults}
            </p>
          ) : (
            <ul className="space-y-1 list-none p-0">
              {topListRoles.map((role) =>
                readOnly ? (
                  <RoleConfigEntry
                    key={role.id}
                    role={role}
                    gameMode={gameMode}
                    roleConfigMode={roleConfigMode}
                    min={readOnlyMin[role.id] ?? 0}
                    max={readOnlyMax[role.id] ?? 0}
                    readOnly={true}
                    dimmed={!isSearching && showAll && !isRoleEnabled(role.id)}
                  />
                ) : (
                  <RoleConfigEntry
                    key={role.id}
                    role={role}
                    gameMode={gameMode}
                    roleConfigMode={roleConfigMode}
                    readOnly={false}
                    disabled={props.disabled}
                    dimmed={
                      !isSearching &&
                      !hasCategoryGrouping &&
                      !isRoleEnabled(role.id)
                    }
                  />
                ),
              )}
            </ul>
          )}
          {!isSearching && hasCategoryGrouping && showAll && (
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
                          min={readOnlyMin[role.id] ?? 0}
                          max={readOnlyMax[role.id] ?? 0}
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
                          min={readOnlyMin[role.id] ?? 0}
                          max={readOnlyMax[role.id] ?? 0}
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
        </CardContent>
      </Card>
    </>
  );
}
