import type { RoleSlot } from "@/lib/types";

/**
 * Adjusts role slots by one step toward the target distribution.
 *
 * On 'add': finds the role most under its target count and adds one slot.
 * On 'remove': finds the role most over its target count and removes one slot.
 *
 * Only roles present in the target are candidates for addition.
 * Only roles with count > 0 are candidates for removal.
 *
 * Target slots are expected to be exact (min === max). Current slots are
 * treated as exact as well (uses min for comparison).
 */
export function adjustRoleSlots(
  current: RoleSlot[],
  target: RoleSlot[],
  operation: "add" | "remove",
): RoleSlot[] {
  const currentMap = new Map(current.map((s) => [s.roleId, s.min]));
  const targetMap = new Map(target.map((s) => [s.roleId, s.min]));

  const isAdd = operation === "add";
  const candidates = isAdd
    ? [...targetMap]
    : ([...currentMap] as [string, number][]).filter(([, c]) => c > 0);
  const otherMap = isAdd ? currentMap : targetMap;
  const compare = (roleId: string, count: number) =>
    count - (otherMap.get(roleId) ?? 0);

  const [bestRole] = candidates.reduce<[string | undefined, number]>(
    ([best, bestScore], [roleId, count]) => {
      const score = compare(roleId, count);
      return score > bestScore ? [roleId, score] : [best, bestScore];
    },
    [undefined, -Infinity],
  );

  if (!bestRole) return current;

  if (isAdd) {
    if (currentMap.has(bestRole)) {
      return current.map((s) =>
        s.roleId === bestRole ? { ...s, min: s.min + 1, max: s.max + 1 } : s,
      );
    }
    return [...current, { roleId: bestRole, min: 1, max: 1 }];
  } else {
    return current
      .map((s) =>
        s.roleId === bestRole ? { ...s, min: s.min - 1, max: s.max - 1 } : s,
      )
      .filter((s) => s.min > 0);
  }
}
