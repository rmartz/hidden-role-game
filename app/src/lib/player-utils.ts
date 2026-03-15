/** Returns the player with the given ID, or undefined if not found. */
export function getPlayer<T extends { id: string }>(
  players?: T[],
  id?: string,
): T | undefined {
  if (!players || !id) return undefined;
  return players.find((p) => p.id === id);
}

/** Returns the player's name, or undefined if the player is not found. */
export function getPlayerName(
  players?: { id: string; name: string }[],
  id?: string,
): string | undefined {
  return getPlayer(players, id)?.name;
}
