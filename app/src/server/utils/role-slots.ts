import type { RoleSlot } from "@/lib/models";

/**
 * Adjusts role slots by one step toward the target distribution.
 *
 * On 'add': finds the role most under its target count and adds one slot.
 * On 'remove': finds the role most over its target count and removes one slot.
 *
 * Only roles present in the target are candidates for addition.
 * Only roles with count > 0 are candidates for removal.
 */
export function adjustRoleSlots(
  current: RoleSlot[],
  target: RoleSlot[],
  operation: "add" | "remove",
): RoleSlot[] {
  const currentMap = new Map(current.map((s) => [s.roleId, s.count]));
  const targetMap = new Map(target.map((s) => [s.roleId, s.count]));

  const isAdd = operation === "add";
  const candidates = isAdd
    ? [...targetMap]
    : ([...currentMap] as [string, number][]).filter(([, c]) => c > 0);
  const otherMap = isAdd ? currentMap : targetMap;
  const compare = (roleId: string, count: number) =>
    count - (otherMap.get(roleId) ?? 0);

  const [bestRole] = candidates.reduce<[string | null, number]>(
    ([best, bestScore], [roleId, count]) => {
      const score = compare(roleId, count);
      return score > bestScore ? [roleId, score] : [best, bestScore];
    },
    [null, -Infinity],
  );

  if (!bestRole) return current;

  if (isAdd) {
    if (currentMap.has(bestRole)) {
      return current.map((s) =>
        s.roleId === bestRole ? { ...s, count: s.count + 1 } : s,
      );
    }
    return [...current, { roleId: bestRole, count: 1 }];
  } else {
    return current
      .map((s) => (s.roleId === bestRole ? { ...s, count: s.count - 1 } : s))
      .filter((s) => s.count > 0);
  }
}
