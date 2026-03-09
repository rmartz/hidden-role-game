import { ServerResponseStatus } from "@/server/models";
import { authenticateLobby, errorResponse } from "@/server/api-helpers";
import { toPublicLobby } from "@/server/lobby-helpers";
import { lobbyService } from "@/services/LobbyService";
import { lobbySocketManager } from "@/server/lobby-socket-manager";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string; playerId: string }> },
): Promise<Response> {
  const { lobbyId, playerId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateLobby(lobbyId, sessionId, { requireNoGame: true });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

  const callerIsOwner = lobby.ownerSessionId === sessionId;
  const callerIsTarget = lobby.players.some(
    (p) => p.id === playerId && p.sessionId === sessionId,
  );

  if (!callerIsOwner && !callerIsTarget) {
    return errorResponse("Unauthorized", 403);
  }

  if (callerIsOwner && callerIsTarget) {
    return errorResponse("Owner cannot leave the lobby", 403);
  }

  const updated = lobbyService.removePlayer(lobbyId, playerId);
  if (updated) {
    lobbySocketManager.broadcast(lobbyId, updated, "player_left");
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: updated ? toPublicLobby(updated, sessionId) : null },
  });
}
