import { ServerResponseStatus } from "@/server/types";
import { gameService } from "@/services/FirebaseGameService";
import { authenticateGame, errorResponse, parseGameMode } from "@/server/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string; gameMode: string }> },
): Promise<Response> {
  const { gameId, gameMode: gameModeParam } = await params;
  const gameMode = parseGameMode(gameModeParam);
  if (!gameMode) return errorResponse("Unknown game mode", 400);

  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;

  if (auth.game.gameMode !== gameMode) {
    return errorResponse("Game mode mismatch", 409);
  }

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
