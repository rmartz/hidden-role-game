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

interface CategoryGroup {
  category: string;
  label: string;
  roles: RoleDefinition<string, Team>[];
}

interface RoleListEntryProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  dimmed: boolean;
  readOnly: boolean;
  /** Only consumed in readOnly mode; ignored by the editable branch. */
  count?: number;
  disabled: boolean;
}

function RoleListEntry({
  role,
  gameMode,
  roleConfigMode,
  dimmed,
  readOnly,
  count,
  disabled,
}: RoleListEntryProps) {
  return readOnly ? (
    <RoleConfigEntry
      role={role}
      gameMode={gameMode}
      roleConfigMode={roleConfigMode}
      count={count ?? 0}
      readOnly={true}
      dimmed={dimmed}
    />
  ) : (
    <RoleConfigEntry
      role={role}
      gameMode={gameMode}
      roleConfigMode={roleConfigMode}
      readOnly={false}
      disabled={disabled}
      dimmed={dimmed}
    />
  );
}

interface ExpandedRoleListProps {
  isSearching: boolean;
  hasCategoryGrouping: boolean;
  searchResultsByCategory: CategoryGroup[];
  uncategorizedSearchResults: RoleDefinition<string, Team>[];
  searchResults: RoleDefinition<string, Team>[];
  disabledByCategory: CategoryGroup[];
  uncategorizedDisabled: RoleDefinition<string, Team>[];
  disabledRoles: RoleDefinition<string, Team>[];
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  readOnly: boolean;
  getCount: (id: string) => number;
  disabled: boolean;
}

function ExpandedRoleList({
  isSearching,
  hasCategoryGrouping,
  searchResultsByCategory,
  uncategorizedSearchResults,
  searchResults,
  disabledByCategory,
  uncategorizedDisabled,
  disabledRoles,
  gameMode,
  roleConfigMode,
  readOnly,
  getCount,
  disabled,
}: ExpandedRoleListProps) {
  const noResults = isSearching && searchResults.length === 0;
  if (noResults) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        {ROLE_CONFIG_COPY.noSearchResults}
      </p>
    );
  }

  // Pick the right data source based on whether a search is active.
  const categorizedGroups = isSearching
    ? searchResultsByCategory
    : disabledByCategory;
  const uncategorizedRoles = isSearching
    ? uncategorizedSearchResults
    : uncategorizedDisabled;
  const flatRoles = isSearching ? searchResults : disabledRoles;

  if (hasCategoryGrouping) {
    return (
      <>
        {categorizedGroups.map(({ category, label, roles }) => (
          <div key={category} className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {label}
            </p>
            <ul className="space-y-1 list-none p-0">
              {roles.map((role) => (
                <RoleListEntry
                  key={role.id}
                  role={role}
                  gameMode={gameMode}
                  roleConfigMode={roleConfigMode}
                  dimmed={true}
                  readOnly={readOnly}
                  count={getCount(role.id)}
                  disabled={disabled}
                />
              ))}
            </ul>
          </div>
        ))}
        {uncategorizedRoles.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-1">
              {ROLE_CONFIG_COPY.uncategorizedLabel}
            </p>
            <ul className="space-y-1 list-none p-0">
              {uncategorizedRoles.map((role) => (
                <RoleListEntry
                  key={role.id}
                  role={role}
                  gameMode={gameMode}
                  roleConfigMode={roleConfigMode}
                  dimmed={true}
                  readOnly={readOnly}
                  count={getCount(role.id)}
                  disabled={disabled}
                />
              ))}
            </ul>
          </div>
        )}
      </>
    );
  }

  return (
    <ul className="space-y-1 list-none p-0 mt-1">
      {flatRoles.map((role) => (
        <RoleListEntry
          key={role.id}
          role={role}
          gameMode={gameMode}
          roleConfigMode={roleConfigMode}
          dimmed={true}
          readOnly={readOnly}
          count={getCount(role.id)}
          disabled={disabled}
        />
      ))}
    </ul>
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

  // Search results grouped by category — only non-empty categories are included.
  const searchResultsByCategory = hasCategoryGrouping
    ? categoryOrder.reduce<
        {
          category: string;
          label: string;
          roles: RoleDefinition<string, Team>[];
        }[]
      >((acc, cat) => {
        const roles = searchResults.filter((r) => r.category === cat);
        if (roles.length > 0)
          acc.push({
            category: cat,
            label: categoryLabels?.[cat] ?? cat,
            roles,
          });
        return acc;
      }, [])
    : [];

  const uncategorizedSearchResults = hasCategoryGrouping
    ? searchResults.filter(
        (r) => !r.category || !categoryOrder.includes(r.category),
      )
    : [];

  // Props forwarded to RoleListEntry at every call site — computed once to avoid
  // repeating the readOnly discriminant inline.
  const entryReadOnly = props.readOnly;
  const entryDisabled = !props.readOnly ? props.disabled : false;
  const getCount = (id: string) =>
    readOnly ? (readOnlyCounts[id] ?? 0) : (roleCounts[id] ?? 0);

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
                    readOnly={entryReadOnly}
                    count={getCount(role.id)}
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
                      />
                      <ExpandedRoleList
                        isSearching={isSearching}
                        hasCategoryGrouping={hasCategoryGrouping}
                        searchResultsByCategory={searchResultsByCategory}
                        uncategorizedSearchResults={uncategorizedSearchResults}
                        searchResults={searchResults}
                        disabledByCategory={disabledByCategory}
                        uncategorizedDisabled={uncategorizedDisabled}
                        disabledRoles={disabledRoles}
                        gameMode={gameMode}
                        roleConfigMode={entryRoleConfigMode}
                        readOnly={entryReadOnly}
                        getCount={getCount}
                        disabled={entryDisabled}
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
