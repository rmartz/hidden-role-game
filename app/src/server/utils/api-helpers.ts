import type { Lobby, Game, GamePlayer } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { isValidSession } from "./lobby-helpers";

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

export function authenticateLobby(
  lobbyId: string,
  sessionId: string | undefined,
  options: LobbyAuthOptions = {},
): Response | { lobby: Lobby; sessionId: string } {
  const { requireOwner = false, requireNoGame = false } = options;

  if (!sessionId) {
    return errorResponse("No session", 401);
  }

  const lobby = lobbyService.getLobby(lobbyId);
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

export function authenticateGame(
  gameId: string,
  sessionId: string | undefined,
): Response | { game: Game; caller: GamePlayer } {
  if (!sessionId) {
    return errorResponse("No session", 401);
  }

  const game = gameService.getGame(gameId);
  const caller = game?.players.find((p) => p.sessionId === sessionId);

  if (!game || !caller) {
    return errorResponse("Forbidden", 403);
  }

  return { game, caller };
}
