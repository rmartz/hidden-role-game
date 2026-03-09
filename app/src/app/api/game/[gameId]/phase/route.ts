import { ServerResponseStatus } from "@/server/models";
import { gameService } from "@/services/GameService";
import { authenticateGame, errorResponse } from "@/server/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  const { gameId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;
  const { game, caller } = auth;

  if (caller.id !== game.ownerPlayerId) {
    return errorResponse("Unauthorized", 403);
  }

  const updated = gameService.advancePhase(gameId);
  if (!updated) {
    return errorResponse("Game cannot advance phase", 409);
  }

  return Response.json({ status: ServerResponseStatus.Success });
}
