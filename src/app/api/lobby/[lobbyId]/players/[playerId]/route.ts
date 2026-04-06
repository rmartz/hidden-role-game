import { ServerResponseStatus } from "@/server/types";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";
import { removePlayer, authorizePlayerRemoval } from "@/server/lobby";

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

  const authError = authorizePlayerRemoval(lobby, playerId, auth.sessionId);
  if (authError) {
    return errorResponse(authError, 403);
  }

  const updated = await removePlayer(lobbyId, playerId);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: updated ? toPublicLobby(updated, sessionId) : null },
  });
}
