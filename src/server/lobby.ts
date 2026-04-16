import { randomUUID } from "crypto";
import type { GameMode, Lobby } from "@/lib/types";
import { playerNameKey } from "@/server/utils/api-helpers";
import {
  RoleConfigMode as RoleConfigModeEnum,
  ShowRolesInPlay as ShowRolesInPlayEnum,
} from "@/lib/types";
import { GAME_MODES, getDefaultRoleBuckets } from "@/lib/game/modes";
import {
  addLobby as firebaseAddLobby,
  getLobby,
  addPlayer,
  removePlayer,
  transferOwner,
  toggleReady,
  updateConfig,
  clearGameId,
  clearReadyPlayerIds,
  setLobbyGameId,
  reorderPlayers,
  renamePlayer,
} from "@/services/lobby";

export {
  getLobby,
  addPlayer,
  removePlayer,
  transferOwner,
  toggleReady,
  updateConfig,
  clearGameId,
  reorderPlayers,
  renamePlayer,
};

/**
 * Marks a lobby as having an active game: clears ready player IDs and records
 * the new game ID in one parallel write. Returns the updated lobby, or
 * undefined if the lobby does not exist.
 */
export async function startLobbyGame(
  lobbyId: string,
  gameId: string,
): Promise<Lobby | undefined> {
  const [, updated] = await Promise.all([
    clearReadyPlayerIds(lobbyId),
    setLobbyGameId(lobbyId, gameId),
  ]);
  return updated;
}

export async function addLobby(
  owner: { id: string; name: string; sessionId: string },
  gameMode: GameMode,
): Promise<Lobby> {
  const lobbyId = randomUUID();
  const base = {
    roleConfigMode: RoleConfigModeEnum.Default,
    roleBuckets: getDefaultRoleBuckets(gameMode, 1),
    showConfigToPlayers: false,
    showRolesInPlay: ShowRolesInPlayEnum.ConfiguredOnly,
  };
  const config = GAME_MODES[gameMode].buildDefaultLobbyConfig(base);

  const lobby: Lobby = {
    id: lobbyId,
    ownerSessionId: owner.sessionId,
    players: [owner],
    playerOrder: [owner.id],
    config,
    readyPlayerIds: [],
  };

  await firebaseAddLobby(lobby);
  return lobby;
}

export const MAX_LOBBY_PLAYERS = 100;

/**
 * Validates that a player can join a lobby: checks capacity and duplicate
 * display name. Returns an error message, or undefined if valid.
 */
export function validatePlayerJoin(
  lobby: Lobby,
  displayName: string,
): string | undefined {
  if (lobby.players.length >= MAX_LOBBY_PLAYERS) {
    return "Lobby is full";
  }
  const incomingKey = playerNameKey(displayName);
  const isDuplicate = lobby.players.some(
    (p) => playerNameKey(p.name) === incomingKey,
  );
  if (isDuplicate) {
    return "A player with that name is already in the lobby";
  }
  return undefined;
}

/**
 * Validates that a player can rename themselves in a lobby: checks duplicate
 * display names while allowing the current player to keep their existing name.
 * Returns an error message, or undefined if valid.
 */
export function validatePlayerRename(
  lobby: Lobby,
  playerId: string,
  displayName: string,
): string | undefined {
  const incomingKey = playerNameKey(displayName);
  const isDuplicate = lobby.players.some(
    (p) => p.id !== playerId && playerNameKey(p.name) === incomingKey,
  );
  if (isDuplicate) {
    return "A player with that name is already in the lobby";
  }
  return undefined;
}

/**
 * Validates that a caller is permitted to remove a player from a lobby.
 * The caller may remove themselves or (as owner) remove others, but the owner
 * cannot remove themselves. Returns an error message, or undefined if allowed.
 */
export function authorizePlayerRemoval(
  lobby: Lobby,
  playerId: string,
  sessionId: string,
): string | undefined {
  const callerIsOwner = lobby.ownerSessionId === sessionId;
  const callerIsTarget = lobby.players.some(
    (p) => p.id === playerId && p.sessionId === sessionId,
  );
  if (!callerIsOwner && !callerIsTarget) {
    return "Unauthorized";
  }
  if (callerIsOwner && callerIsTarget) {
    return "Owner cannot leave the lobby";
  }
  return undefined;
}
