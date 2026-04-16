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
import type { CategoryGroup } from "./ExpandedRoleList";
import { ExpandedRoleList } from "./ExpandedRoleList";
import { RoleListEntry } from "./RoleListEntry";

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
  const hasCategoryGrouping = !!categoryOrder && categoryOrder.length > 0;
  // Explicit type annotation prevents TypeScript narrowing roleConfigMode inside
  // the !isAdvanced JSX block from making it incompatible with RoleListEntryProps.
  const entryRoleConfigMode: RoleConfigMode = roleConfigMode;

  function isRoleEnabled(roleId: string): boolean {
    if (readOnly) return (readOnlyCounts[roleId] ?? 0) > 0;
    return (roleCounts[roleId] ?? 0) > 0;
  }

  const enabledRoles = allRoles.filter((r) => isRoleEnabled(r.id));
  const disabledRoles = allRoles.filter((r) => !isRoleEnabled(r.id));
  const hasExtraRoles = disabledRoles.length > 0;

  const isSearching = showAll && searchQuery.trim() !== "";

  // Search only applies to the extra (disabled) roles — active roles are always visible.
  const searchResults = isSearching
    ? searchRoles(disabledRoles, searchQuery, { categoryLabels })
    : [];

  // Disabled roles grouped by category — used in both expanded + no-search + categorized
  // and expanded + active search + categorized states.
  const disabledByCategory = hasCategoryGrouping
    ? categoryOrder.reduce<CategoryGroup[]>((acc, cat) => {
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

  const entryDisabled = readOnly ? false : props.disabled;
  const counts = readOnly ? readOnlyCounts : roleCounts;

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
                                roleConfigMode={entryRoleConfigMode}
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
              {/* Active roles — always visible regardless of search or expansion state. */}
              <ul className="space-y-1 list-none p-0">
                {enabledRoles.map((role) => (
                  <RoleListEntry
                    key={role.id}
                    role={role}
                    gameMode={gameMode}
                    roleConfigMode={entryRoleConfigMode}
                    dimmed={false}
                    readOnly={readOnly}
                    count={counts[role.id] ?? 0}
                    disabled={entryDisabled}
                  />
                ))}
              </ul>
              {hasExtraRoles && (
                <>
                  {/* Toggle sits between active roles and the extra-roles section. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={toggleShowAll}
                    disabled={entryDisabled}
                  >
                    {showAll
                      ? ROLE_CONFIG_COPY.hideExtraRoles
                      : ROLE_CONFIG_COPY.showAllRoles}
                  </Button>
                  {showAll && (
                    <>
                      {/* Search input — only visible when expanded. */}
                      <Input
                        type="search"
                        placeholder={ROLE_CONFIG_COPY.searchPlaceholder}
                        aria-label={ROLE_CONFIG_COPY.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                        }}
                        className="mt-2"
                        disabled={entryDisabled}
                      />
                      <ExpandedRoleList
                        isSearching={isSearching}
                        hasCategoryGrouping={hasCategoryGrouping}
                        searchResults={searchResults}
                        disabledByCategory={disabledByCategory}
                        uncategorizedDisabled={uncategorizedDisabled}
                        disabledRoles={disabledRoles}
                        gameMode={gameMode}
                        roleConfigMode={entryRoleConfigMode}
                        readOnly={readOnly}
                        counts={counts}
                        formDisabled={entryDisabled}
                      />
                    </>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
