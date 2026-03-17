/**
 * Firebase Realtime Database schema types and conversion helpers.
 *
 * Data layout:
 *   /lobbies/{lobbyId}/public   — PublicLobby equivalent (world-readable)
 *   /lobbies/{lobbyId}/private  — ownerSessionId + per-player sessionIds (server-only)
 *   /games/{gameId}/playerState/{sessionId} — pre-computed PlayerGameState
 *
 * Arrays (roleSlots, players, roleAssignments) are stored as Firebase objects
 * (Record keyed by a stable key) to avoid Firebase array-reindexing issues.
 */
export * from "./lobby";
export * from "./game";
export * from "./player-state";
