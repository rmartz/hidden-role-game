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

  if (operation === "add") {
    let bestRole: string | null = null;
    let bestDiff = -Infinity;
    for (const [roleId, targetCount] of targetMap) {
      const diff = targetCount - (currentMap.get(roleId) ?? 0);
      if (diff > bestDiff) {
        bestDiff = diff;
        bestRole = roleId;
      }
    }
    if (!bestRole) return current;

    if (currentMap.has(bestRole)) {
      return current.map((s) =>
        s.roleId === bestRole ? { ...s, count: s.count + 1 } : s,
      );
    }
    return [...current, { roleId: bestRole, count: 1 }];
  } else {
    let bestRole: string | null = null;
    let bestDiff = -Infinity;
    for (const [roleId, currentCount] of currentMap) {
      if (currentCount <= 0) continue;
      const diff = currentCount - (targetMap.get(roleId) ?? 0);
      if (diff > bestDiff) {
        bestDiff = diff;
        bestRole = roleId;
      }
    }
    if (!bestRole) return current;

    return current
      .map((s) => (s.roleId === bestRole ? { ...s, count: s.count - 1 } : s))
      .filter((s) => s.count > 0);
  }
}
