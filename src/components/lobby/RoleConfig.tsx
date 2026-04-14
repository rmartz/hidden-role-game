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
  const categoryOrder = props.categoryOrder;
  const categoryLabels = props.categoryLabels;
  const hasCategoryGrouping = !!categoryOrder;

  function isRoleEnabled(roleId: string): boolean {
    if (readOnly) return (readOnlyMax[roleId] ?? 0) > 0;
    if (roleConfigMode === RoleConfigMode.Advanced)
      return (roleMaxes[roleId] ?? 0) > 0;
    return (roleCounts[roleId] ?? 0) > 0;
  }

  const isSearching = showAll && searchQuery.trim() !== "";

  // When showAll: all roles, filtered by search if a query is active.
  // When collapsed: only enabled roles.
  const visibleRoles = showAll
    ? isSearching
      ? searchRoles(allRoles, searchQuery, { categoryLabels })
      : allRoles
    : allRoles.filter((r) => isRoleEnabled(r.id));

  const noResults = isSearching && visibleRoles.length === 0;
  const hasDisabledRoles = allRoles.some((r) => !isRoleEnabled(r.id));

  const categoryGroups = hasCategoryGrouping
    ? categoryOrder.reduce<
        {
          category: string;
          label: string;
          roles: RoleDefinition<string, Team>[];
        }[]
      >((acc, cat) => {
        const roles = visibleRoles.filter((r) => r.category === cat);
        if (roles.length > 0)
          acc.push({
            category: cat,
            label: categoryLabels?.[cat] ?? cat,
            roles,
          });
        return acc;
      }, [])
    : [];

  const uncategorizedVisible = hasCategoryGrouping
    ? visibleRoles.filter(
        (r) => !r.category || !categoryOrder.includes(r.category),
      )
    : [];

  const flatVisible = hasCategoryGrouping ? [] : visibleRoles;

  function isDimmedRole(role: RoleDefinition<string, Team>): boolean {
    return showAll && !isRoleEnabled(role.id);
  }

  function toggleShowAll() {
    if (showAll) setSearchQuery("");
    setShowAll((prev) => !prev);
  }

  return (
    <>
      {!readOnly && <RoleConfigModePicker disabled={props.disabled} />}
      <Card>
        <CardHeader>
          <CardTitle>{ROLE_CONFIG_COPY.title}</CardTitle>
          {!readOnly && (
            <p className="text-sm text-muted-foreground">
              {isAdvanced
                ? `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (min total: ${String(sum(Object.values(roleMins)))}, max total: ${String(sum(Object.values(roleMaxes)))})`
                : `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (${String(total)}/${String(playerCount)} assigned)`}
            </p>
          )}
          {showAll && (
            <Input
              type="search"
              placeholder={ROLE_CONFIG_COPY.searchPlaceholder}
              aria-label={ROLE_CONFIG_COPY.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="mt-1"
            />
          )}
        </CardHeader>
        <CardContent>
          {noResults ? (
            <p className="text-sm text-muted-foreground py-2">
              {ROLE_CONFIG_COPY.noSearchResults}
            </p>
          ) : hasCategoryGrouping ? (
            <div className="space-y-4">
              {categoryGroups.map(({ category, label, roles }) => (
                <div key={category}>
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
                          dimmed={isDimmedRole(role)}
                        />
                      ) : (
                        <RoleConfigEntry
                          key={role.id}
                          role={role}
                          gameMode={gameMode}
                          roleConfigMode={roleConfigMode}
                          readOnly={false}
                          disabled={props.disabled}
                          dimmed={isDimmedRole(role)}
                          showingAll={showAll}
                        />
                      ),
                    )}
                  </ul>
                </div>
              ))}
              {uncategorizedVisible.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {ROLE_CONFIG_COPY.uncategorizedLabel}
                  </p>
                  <ul className="space-y-1 list-none p-0">
                    {uncategorizedVisible.map((role) =>
                      readOnly ? (
                        <RoleConfigEntry
                          key={role.id}
                          role={role}
                          gameMode={gameMode}
                          roleConfigMode={roleConfigMode}
                          min={readOnlyMin[role.id] ?? 0}
                          max={readOnlyMax[role.id] ?? 0}
                          readOnly={true}
                          dimmed={isDimmedRole(role)}
                        />
                      ) : (
                        <RoleConfigEntry
                          key={role.id}
                          role={role}
                          gameMode={gameMode}
                          roleConfigMode={roleConfigMode}
                          readOnly={false}
                          disabled={props.disabled}
                          dimmed={isDimmedRole(role)}
                          showingAll={showAll}
                        />
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-1 list-none p-0">
              {flatVisible.map((role) =>
                readOnly ? (
                  <RoleConfigEntry
                    key={role.id}
                    role={role}
                    gameMode={gameMode}
                    roleConfigMode={roleConfigMode}
                    min={readOnlyMin[role.id] ?? 0}
                    max={readOnlyMax[role.id] ?? 0}
                    readOnly={true}
                    dimmed={isDimmedRole(role)}
                  />
                ) : (
                  <RoleConfigEntry
                    key={role.id}
                    role={role}
                    gameMode={gameMode}
                    roleConfigMode={roleConfigMode}
                    readOnly={false}
                    disabled={props.disabled}
                    dimmed={isDimmedRole(role)}
                    showingAll={showAll}
                  />
                ),
              )}
            </ul>
          )}
          {hasDisabledRoles && (
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
