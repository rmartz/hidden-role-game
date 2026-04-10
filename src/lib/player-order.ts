/**
 * Reconstructs a canonical player order from a stored order and the current
 * set of player IDs. Stored IDs that no longer exist are dropped; any player
 * ID not present in the stored order is appended at the end.
 *
 * This is used in two places:
 * - Firebase lobby deserialization (to handle players joining/leaving)
 * - Secret Villain turn-state initialization (to apply the lobby seating order)
 */
export function resolvePlayerOrder(
  storedOrder: string[] | undefined,
  currentPlayerIds: string[],
): string[] {
  const knownIds = new Set(currentPlayerIds);
  const filtered = (storedOrder ?? []).filter((id) => knownIds.has(id));
  const filteredSet = new Set(filtered);
  const remaining = currentPlayerIds.filter((id) => !filteredSet.has(id));
  return [...filtered, ...remaining];
}
