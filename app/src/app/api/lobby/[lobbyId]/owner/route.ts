import { ServerResponseStatus } from "@/server/models";
import { authenticateLobby, errorResponse } from "@/server/api-helpers";
import { toPublicLobby } from "@/server/lobby-helpers";
import { lobbyService } from "@/services/LobbyService";
import { lobbyBroadcastService } from "@/services/LobbyBroadcastService";
import { LobbyChangeReason } from "@/server/models/websocket";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;

  const { playerId } = (await request.json()) as { playerId: string };
  const updated = lobbyService.transferOwner(lobbyId, playerId);

  if (!updated) {
    return errorResponse("Player not found", 404);
  }

  lobbyBroadcastService.broadcast(lobbyId, LobbyChangeReason.OwnerChanged);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
