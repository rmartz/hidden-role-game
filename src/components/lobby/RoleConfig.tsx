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
import { Input } from "@/components/ui/input";
import { RoleConfigEntry } from "./RoleConfigEntry";
import { RoleConfigModePicker } from "./RoleConfigModePicker";
import { RoleBucketConfig } from "./RoleBucketConfig";
import { ROLE_CONFIG_COPY } from "./RoleConfig.copy";
import { searchRoles } from "./searchRoles";

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

function renderEntry(
  role: RoleDefinition<string, Team>,
  props: RoleConfigProps,
  readOnlyCounts: Record<string, number>,
  dimmed: boolean,
) {
  if (props.readOnly) {
    return (
      <RoleConfigEntry
        key={role.id}
        role={role}
        gameMode={props.gameMode}
        roleConfigMode={props.roleConfigMode}
        count={readOnlyCounts[role.id] ?? 0}
        readOnly={true}
        dimmed={dimmed}
      />
    );
  }
  return (
    <RoleConfigEntry
      key={role.id}
      role={role}
      gameMode={props.gameMode}
      roleConfigMode={props.roleConfigMode}
      readOnly={false}
      disabled={props.disabled}
      dimmed={dimmed}
    />
  );
}

export function RoleConfig(props: RoleConfigProps) {
  const { roleDefinitions, playerCount, gameMode, roleConfigMode, readOnly } =
    props;

  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
  const categoryOrder = props.categoryOrder;
  const categoryLabels = props.categoryLabels;
  const hasCategoryGrouping = !!categoryOrder;

  function isRoleEnabled(roleId: string): boolean {
    if (readOnly) return (readOnlyCounts[roleId] ?? 0) > 0;
    return (roleCounts[roleId] ?? 0) > 0;
  }

  const enabledRoles = allRoles.filter((r) => isRoleEnabled(r.id));
  const disabledRoles = allRoles.filter((r) => !isRoleEnabled(r.id));
  const hasExtraRoles = disabledRoles.length > 0;

  const isSearching = showAll && searchQuery.trim() !== "";

  // Disabled roles grouped by category — only used in expanded + no-search + categorized state.
  const disabledByCategory = hasCategoryGrouping
    ? categoryOrder.reduce<
        {
          category: string;
          label: string;
          roles: RoleDefinition<string, Team>[];
        }[]
      >((acc, cat) => {
        const roles = disabledRoles.filter((r) => r.category === cat);
        if (roles.length > 0)
          acc.push({
            category: cat,
            label: categoryLabels?.[cat] ?? cat,
            roles,
          });
        return acc;
      }, [])
    : [];

  const uncategorizedDisabled = hasCategoryGrouping
    ? disabledRoles.filter(
        (r) => !r.category || !categoryOrder.includes(r.category),
      )
    : [];

  const searchResults = isSearching
    ? searchRoles(allRoles, searchQuery, { categoryLabels })
    : [];

  const noResults = isSearching && searchResults.length === 0;

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
          {!readOnly && !isAdvanced && (
            <p className="text-sm text-muted-foreground">
              {`Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (${String(total)}/${String(playerCount)} assigned)`}
            </p>
          )}
          {showAll && !isAdvanced && (
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
              {noResults ? (
                <p className="text-sm text-muted-foreground py-2">
                  {ROLE_CONFIG_COPY.noSearchResults}
                </p>
              ) : isSearching ? (
                // Expanded + active search: flat list of matching roles, disabled ones dimmed.
                <ul className="space-y-1 list-none p-0">
                  {searchResults.map((role) =>
                    renderEntry(
                      role,
                      props,
                      readOnlyCounts,
                      !isRoleEnabled(role.id),
                    ),
                  )}
                </ul>
              ) : (
                // Collapsed or expanded + no search: flat enabled roles at top.
                <>
                  <ul className="space-y-1 list-none p-0">
                    {enabledRoles.map((role) =>
                      renderEntry(role, props, readOnlyCounts, false),
                    )}
                  </ul>
                  {showAll && hasCategoryGrouping && (
                    // Expanded + no search + categorized: disabled roles grouped by category.
                    <>
                      {disabledByCategory.map(({ category, label, roles }) => (
                        <div key={category} className="mt-4">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            {label}
                          </p>
                          <ul className="space-y-1 list-none p-0">
                            {roles.map((role) =>
                              renderEntry(role, props, readOnlyCounts, true),
                            )}
                          </ul>
                        </div>
                      ))}
                      {uncategorizedDisabled.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            {ROLE_CONFIG_COPY.uncategorizedLabel}
                          </p>
                          <ul className="space-y-1 list-none p-0">
                            {uncategorizedDisabled.map((role) =>
                              renderEntry(role, props, readOnlyCounts, true),
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  {showAll && !hasCategoryGrouping && (
                    // Expanded + no search + uncategorized: disabled roles appended flat.
                    <ul className="space-y-1 list-none p-0 mt-1">
                      {disabledRoles.map((role) =>
                        renderEntry(role, props, readOnlyCounts, true),
                      )}
                    </ul>
                  )}
                </>
              )}
              {hasExtraRoles && (
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
