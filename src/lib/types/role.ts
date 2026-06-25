// --- Team and Role Definition types ---

export enum Team {
  Good = "Good",
  Bad = "Bad",
  Neutral = "Neutral",
}

export interface RoleDefinition<
  Role extends string = string,
  T extends string = string,
> {
  id: Role;
  name: string;
  team: T;
  /** Short one-line description shown in tooltips and glossary headers. */
  summary?: string;
  /** Full description shown in the expanded glossary entry. */
  description?: string;
  /**
   * Players matching these criteria are visible.
   * - Team matches (`teams`) reveal identity only, not role.
   * - Role matches (`roles`) reveal the exact role by default. Set
   *   `revealRole: false` to suppress this (e.g. Percival sees Merlin and
   *   Morgana but cannot tell them apart). Set `revealRole: true` to force
   *   role revelation even for team matches.
   * - `excludeRoles` removes specific roles from team-based matching (e.g.
   *   Merlin excludes Mordred from Evil team awareness; Evil roles exclude Oberon).
   */
  awareOf?: {
    teams?: T[];
    roles?: Role[];
    revealRole?: boolean;
    excludeRoles?: Role[];
  };
  /** Used to group roles in the role config UI and glossary. */
  category?: string;
  /** Alternative names or terms this role can be found by when searching. */
  aliases?: string[];
  /** Roles that wake alone with unique individual mechanics — multiple copies would break narrator UX. */
  unique?: true;
}
