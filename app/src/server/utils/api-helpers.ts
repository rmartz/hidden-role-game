import type { Lobby, Game, GamePlayer } from "@/lib/types";
import { GameMode } from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { isValidSession } from "./lobby-helpers";

export function parseGameMode(value: string): GameMode | undefined {
  return (Object.values(GameMode) as string[]).includes(value)
    ? (value as GameMode)
    : undefined;
}

export function errorResponse(error: string, status: number): Response {
  return Response.json(
    { status: ServerResponseStatus.Error, error },
    { status },
  );
}

interface LobbyAuthOptions {
  requireOwner?: boolean;
  requireNoGame?: boolean;
}

export async function authenticateLobby(
  lobbyId: string,
  sessionId: string | undefined,
  options: LobbyAuthOptions = {},
): Promise<Response | { lobby: Lobby; sessionId: string }> {
  const { requireOwner = false, requireNoGame = false } = options;

  if (!sessionId) {
    return errorResponse("No session", 401);
  }

  const lobby = await lobbyService.getLobby(lobbyId);
  if (!lobby) {
    return errorResponse("Lobby not found", 404);
  }

  if (!isValidSession(lobby, sessionId)) {
    return errorResponse("Unauthorized", 403);
  }

  if (requireOwner && lobby.ownerSessionId !== sessionId) {
    return errorResponse("Unauthorized", 403);
  }

  if (requireNoGame && lobby.gameId) {
    return errorResponse("Game already started", 409);
  }

  return { lobby, sessionId };
}

export async function authenticateGame(
  gameId: string,
  sessionId?: string,
): Promise<Response | { game: Game; caller: GamePlayer }> {
  if (!sessionId) {
    return errorResponse("No session", 401);
  }

  const game = await gameService.getGame(gameId);
  const caller = game?.players.find((p) => p.sessionId === sessionId);

  if (!game || !caller) {
    return errorResponse("Forbidden", 403);
  }

  return { game, caller };
}

const MAX_PLAYER_NAME_LENGTH = 32;
// Block HTML and JSON structural characters while allowing international scripts
const INVALID_NAME_CHARS = /[<>&"{}[\]\\`]/;

export function validatePlayerName(name: string): string | undefined {
  if (!name || name.length === 0) {
    return "Player name must not be empty";
  }
  if (name.length > MAX_PLAYER_NAME_LENGTH) {
    return `Player name must be ${String(MAX_PLAYER_NAME_LENGTH)} characters or fewer`;
  }
  if (INVALID_NAME_CHARS.test(name)) {
    return "Player name contains invalid characters";
  }
  return undefined;
}
