import { ServerResponseStatus } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
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

  const auth = await authenticateLobby(lobbyId, sessionId);
  if (auth instanceof Response) return auth;

  const updated = await lobbyService.clearGameId(lobbyId);
  if (!updated) {
    return errorResponse("Failed to return to lobby", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
