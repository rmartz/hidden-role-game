import { ServerResponseStatus } from "@/server/types";
import { lobbyService } from "@/services/FirebaseLobbyService";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;

  const { lobby } = auth;

  const callerPlayer = lobby.players.find(
    (p) => p.sessionId === auth.sessionId,
  );
  if (!callerPlayer) {
    return errorResponse("Player not found", 404);
  }

  if (
    callerPlayer.id ===
    lobby.players.find((p) => p.sessionId === lobby.ownerSessionId)?.id
  ) {
    return errorResponse("Owner cannot ready up", 400);
  }

  const updated = await lobbyService.toggleReady(lobbyId, callerPlayer.id);
  if (!updated) {
    return errorResponse("Failed to toggle ready state", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
