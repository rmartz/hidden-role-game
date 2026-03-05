import { ServerResponseStatus } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { isValidSession, toPublicLobby } from "@/server/lobby-helpers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;
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
        error: "Only the owner can transfer ownership",
      },
      { status: 403 },
    );
  }

  if (lobby.game) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Cannot transfer ownership after the game has started",
      },
      { status: 409 },
    );
  }

  const { playerId } = await request.json();
  const updated = lobbyService.transferOwner(lobbyId, playerId);

  if (!updated) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Player not found" },
      { status: 404 },
    );
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated) },
  });
}
