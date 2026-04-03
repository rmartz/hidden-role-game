import { ServerResponseStatus } from "@/server/types";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";
import { lobbyService } from "@/services/FirebaseLobbyService";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;

  const { playerId } = (await request.json()) as { playerId: string };
  const updated = await lobbyService.transferOwner(lobbyId, playerId);

  if (!updated) {
    return errorResponse("Player not found", 404);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
