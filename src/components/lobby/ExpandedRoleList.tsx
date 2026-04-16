import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import { RoleConfigMode } from "@/lib/types";
import { ROLE_CONFIG_COPY } from "./RoleConfig.copy";
import { RoleListEntry } from "./RoleListEntry";

export interface CategoryGroup {
  category: string;
  label: string;
  roles: RoleDefinition<string, Team>[];
}

export interface ExpandedRoleListProps {
  isSearching: boolean;
  hasCategoryGrouping: boolean;
  searchResults: RoleDefinition<string, Team>[];
  disabledByCategory: CategoryGroup[];
  uncategorizedDisabled: RoleDefinition<string, Team>[];
  disabledRoles: RoleDefinition<string, Team>[];
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  readOnly: boolean;
  /** Pre-resolved role count lookup (readOnlyCounts or roleCounts from Redux). */
  counts: Record<string, number>;
  /** Whether the enclosing configuration form is disabled (e.g., during a save). */
  formDisabled: boolean;
}

export function ExpandedRoleList({
  isSearching,
  hasCategoryGrouping,
  searchResults,
  disabledByCategory,
  uncategorizedDisabled,
  disabledRoles,
  gameMode,
  roleConfigMode,
  readOnly,
  counts,
  formDisabled,
}: ExpandedRoleListProps) {
  const noResults = isSearching && searchResults.length === 0;
  const flatRoles = isSearching ? searchResults : disabledRoles;

  const entryProps = (role: RoleDefinition<string, Team>) => ({
    role,
    gameMode,
    roleConfigMode,
    dimmed: true as const,
    readOnly,
    count: counts[role.id] ?? 0,
    disabled: formDisabled,
  });

  return noResults ? (
    <p className="text-sm text-muted-foreground py-2">
      {ROLE_CONFIG_COPY.noSearchResults}
    </p>
  ) : hasCategoryGrouping && !isSearching ? (
    <>
      {disabledByCategory.map(({ category, label, roles }) => (
        <div key={category} className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {label}
          </p>
          <ul className="space-y-1 list-none p-0">
            {roles.map((role) => (
              <RoleListEntry key={role.id} {...entryProps(role)} />
            ))}
          </ul>
        </div>
      ))}
      {uncategorizedDisabled.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {ROLE_CONFIG_COPY.uncategorizedLabel}
          </p>
          <ul className="space-y-1 list-none p-0">
            {uncategorizedDisabled.map((role) => (
              <RoleListEntry key={role.id} {...entryProps(role)} />
            ))}
          </ul>
        </div>
      )}
    </>
  ) : (
    <ul className="space-y-1 list-none p-0 mt-1">
      {flatRoles.map((role) => (
        <RoleListEntry key={role.id} {...entryProps(role)} />
      ))}
    </ul>
  );
}
