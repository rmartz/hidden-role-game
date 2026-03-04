import { ServerResponseStatus } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { isValidSession, toPublicLobby } from "@/server/lobby-helpers";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string; playerId: string }> },
): Promise<Response> {
  const { lobbyId, playerId } = await params;
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

  const callerIsOwner = lobby.ownerSessionId === sessionId;
  const callerIsTarget = lobby.players.some(
    (p) => p.id === playerId && p.sessionId === sessionId,
  );

  if (!callerIsOwner && !callerIsTarget) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Unauthorized" },
      { status: 403 },
    );
  }

  if (callerIsOwner && callerIsTarget) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Owner cannot leave the lobby",
      },
      { status: 403 },
    );
  }

  if (lobby.game) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Cannot remove players after the game has started",
      },
      { status: 409 },
    );
  }

  const updated = lobbyService.removePlayer(lobbyId, playerId);
  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: updated ? toPublicLobby(updated) : null },
  });
}
