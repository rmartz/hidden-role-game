/** Returns the player with the given ID, or undefined if not found. */
export function getPlayer<T extends { id: string }>(
  players: T[],
  id: string,
): T | undefined {
  return players.find((p) => p.id === id);
}
