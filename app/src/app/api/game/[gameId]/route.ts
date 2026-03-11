import { ServerResponseStatus } from "@/server/models";
import { gameService } from "@/services/GameService";
import { authenticateGame, errorResponse } from "@/server/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  const { gameId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;
  const { game, caller } = auth;

  const gameState = gameService.getPlayerGameState(game, caller.id);
  if (!gameState) {
    return errorResponse("Role not assigned", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: gameState,
  });
}
