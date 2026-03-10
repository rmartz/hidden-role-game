import type { LobbyPlayer, PlayerRoleAssignment } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

/**
 * Assigns roles to players by expanding role slots into a flat list, shuffling
 * with Fisher-Yates, then pairing each player with the role at their index.
 *
 * Example: [{roleId: "good", count: 2}, {roleId: "bad", count: 1}]
 * expands to ["good", "good", "bad"], then shuffles to (e.g.) ["bad", "good", "good"],
 * then assigns player[0] → "bad", player[1] → "good", player[2] → "good".
 */
export function assignRoles(
  players: LobbyPlayer[],
  roleSlots: RoleSlot[],
): PlayerRoleAssignment[] {
  // Build a flat list of role IDs by expanding each slot's count.
  const roleIds: string[] = [];
  for (const slot of roleSlots) {
    for (let i = 0; i < slot.count; i++) {
      roleIds.push(slot.roleId);
    }
  }

  // Fisher-Yates shuffle: iterate from the end, swapping each element with a
  // randomly chosen element at or before it. This produces an unbiased
  // permutation so every player is equally likely to receive any role.
  for (let i = roleIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = roleIds[i];
    if (tmp === undefined || roleIds[j] === undefined)
      throw new Error("Index out of bounds during shuffle");
    roleIds[i] = roleIds[j];
    roleIds[j] = tmp;
  }

  return players.map((p, i) => {
    const roleDefinitionId = roleIds[i];
    if (roleDefinitionId === undefined)
      throw new Error(`No role for player at index ${String(i)}`);
    return { playerId: p.id, roleDefinitionId };
  });
}
