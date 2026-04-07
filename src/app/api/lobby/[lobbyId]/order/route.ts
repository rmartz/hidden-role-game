import { ServerResponseStatus } from "@/server/types";
import { reorderPlayers } from "@/server/lobby";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";
import { validatePlayerOrder } from "./validate-order";

export async function PUT(
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

  const body = (await request.json()) as unknown;
  const validation = validatePlayerOrder(body, lobby.players);
  if (!validation.valid) {
    return errorResponse(validation.error, validation.status);
  }

  const updated = await reorderPlayers(lobbyId, validation.playerOrder);
  if (!updated) {
    return errorResponse("Failed to update player order", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
