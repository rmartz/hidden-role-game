import { ServerResponseStatus } from "@/server/types";
import { gameService } from "@/services/GameService";
import { authenticateGame, errorResponse } from "@/server/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  const { gameId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;

  const gameState = await gameService.getPlayerGameStateBySession(
    gameId,
    auth.caller.sessionId,
  );
  if (!gameState) {
    return errorResponse("Game state not found", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: gameState,
  });
}
