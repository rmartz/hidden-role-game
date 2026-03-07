import { GameMode } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import type { CreateGameRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { isValidSession, toPublicLobby } from "@/server/lobby-helpers";

export async function POST(request: Request): Promise<Response> {
  const sessionId = request.headers.get("x-session-id") ?? undefined;
  const { lobbyId, roleSlots, gameMode }: CreateGameRequest =
    await request.json();

  if (!Object.values(GameMode).includes(gameMode)) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Unknown game mode" },
      { status: 400 },
    );
  }
  const lobby = lobbyService.getLobby(lobbyId);

  if (!lobby) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Lobby not found" },
      { status: 404 },
    );
  }

  if (!sessionId || !isValidSession(lobby, sessionId)) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Unauthorized" },
      { status: 403 },
    );
  }

  if (lobby.ownerSessionId !== sessionId) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Only the owner can start the game",
      },
      { status: 403 },
    );
  }

  if (lobby.gameId) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Game already started" },
      { status: 409 },
    );
  }

  const totalSlots = roleSlots.reduce((sum, s) => sum + s.count, 0);
  if (totalSlots !== lobby.players.length) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Role slot count must match player count",
      },
      { status: 400 },
    );
  }

  const validRoleIds = new Set(
    gameService.getRoleDefinitions(gameMode).map((r) => r.id),
  );
  for (const slot of roleSlots) {
    if (!validRoleIds.has(slot.roleId)) {
      return Response.json(
        {
          status: ServerResponseStatus.Error,
          error: `Unknown role: ${slot.roleId}`,
        },
        { status: 400 },
      );
    }
  }

  const game = gameService.createGame(
    lobbyId,
    lobby.players,
    roleSlots,
    gameMode,
  );
  const updated = lobbyService.setGameId(lobbyId, game.id);
  if (!updated) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Failed to start game" },
      { status: 500 },
    );
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated) },
  });
}
