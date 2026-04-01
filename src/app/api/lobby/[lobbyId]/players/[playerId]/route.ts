import { ServerResponseStatus } from "@/server/types";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";
import { lobbyService } from "@/services/LobbyService";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string; playerId: string }> },
): Promise<Response> {
  const { lobbyId, playerId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireNoGame: true,
  });
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

  const updated = await lobbyService.removePlayer(lobbyId, playerId);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: updated ? toPublicLobby(updated, sessionId) : null },
  });
}
