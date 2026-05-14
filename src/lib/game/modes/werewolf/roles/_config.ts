import type { RoleBucket } from "@/lib/types";
import { WerewolfRole } from "./_types";

export const MIN_PLAYERS = 7;

/** Minimum number of players who receive roles (= MIN_PLAYERS - 1, excluding the Narrator). */
export const MIN_ROLE_PLAYERS = MIN_PLAYERS - 1;

export function defaultRoleCount(numRolePlayers: number): RoleBucket[] {
  // numRolePlayers is already the number of role-receiving players (Narrator excluded by caller).
  // Includes any hidden unassigned role slots (hiddenRoleCount).
  // Werewolf count: 6-8 role-players → 1, 9-11 → 2, 12-14 → 3, etc.
  const n = Math.max(numRolePlayers, MIN_ROLE_PLAYERS);
  const werewolves = Math.max(1, Math.floor((n - 3) / 3));
  const villagers = n - werewolves - 1;
  return [
    { playerCount: werewolves, roleId: WerewolfRole.Werewolf },
    { playerCount: villagers, roleId: WerewolfRole.Villager },
    { playerCount: 1, roleId: WerewolfRole.Seer },
  ];
}
