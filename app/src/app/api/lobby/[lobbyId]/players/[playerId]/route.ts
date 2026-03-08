import { ServerResponseStatus } from "@/server/models";
import { authenticateLobby, errorResponse } from "@/server/api-helpers";
import { toPublicLobby } from "@/server/lobby-helpers";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { adjustRoleSlots } from "@/server/adjustRoleSlots";

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
    const target = gameService.defaultRoleCount(
      updated.config.gameMode,
      updated.players.length,
    );
    updated.config.roleSlots = adjustRoleSlots(
      updated.config.roleSlots,
      target,
      "remove",
    );
  }
  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: updated ? toPublicLobby(updated, sessionId) : null },
  });
}
