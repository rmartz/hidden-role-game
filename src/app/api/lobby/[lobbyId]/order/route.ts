import { ServerResponseStatus } from "@/server/types";
import { reorderPlayers } from "@/server/lobby";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";

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

  const body = (await request.json()) as { playerOrder?: unknown };
  const playerOrder = body.playerOrder;

  if (
    !Array.isArray(playerOrder) ||
    !playerOrder.every((v) => typeof v === "string")
  ) {
    return errorResponse("playerOrder must be an array of strings", 400);
  }

  const lobbyPlayerIds = new Set(lobby.players.map((p) => p.id));
  const orderIds = new Set(playerOrder);

  if (
    playerOrder.length !== lobby.players.length ||
    [...lobbyPlayerIds].some((id) => !orderIds.has(id))
  ) {
    return errorResponse(
      "playerOrder must contain exactly all current player IDs",
      400,
    );
  }

  const updated = await reorderPlayers(lobbyId, playerOrder);
  if (!updated) {
    return errorResponse("Failed to update player order", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
