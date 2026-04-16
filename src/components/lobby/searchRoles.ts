import type { RoleDefinition, Team } from "@/lib/types";

/**
 * Filters a list of role definitions by a search query.
 *
 * Matches against the role's name, summary, description, category value,
 * the human-readable category label (when provided), and any defined aliases.
 * Matching is case-insensitive and treats each word in the query independently
 * so that "evil killing" matches the category "Evil — Killing".
 */
export function searchRoles(
  roles: RoleDefinition<string, Team>[],
  query: string,
  options?: { categoryLabels?: Record<string, string> },
): RoleDefinition<string, Team>[] {
  const trimmed = query.trim();
  if (trimmed === "") return roles;

  const terms = trimmed.toLowerCase().split(/\s+/);

  return roles.filter((role) => {
    const searchableText = [
      role.name,
      role.summary,
      role.description,
      role.category,
      role.category ? (options?.categoryLabels?.[role.category] ?? "") : "",
      ...(role.aliases ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return terms.every((term) => searchableText.includes(term));
  });
}
