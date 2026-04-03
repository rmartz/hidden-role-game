import { ServerResponseStatus } from "@/server/types";
import { gameService } from "@/services/GameService";
import { authenticateGame, errorResponse, parseGameMode } from "@/server/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string; gameMode: string }> },
): Promise<Response> {
  const { gameId, gameMode: gameModeParam } = await params;
  const gameMode = parseGameMode(gameModeParam);
  if (!gameMode) return errorResponse("Unknown game mode", 400);

  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;
  const { game, caller } = auth;

  if (game.gameMode !== gameMode) {
    return errorResponse("Game mode mismatch", 409);
  }

  // Owner-only for games with a narrator; any player can advance otherwise.
  if (game.ownerPlayerId && caller.id !== game.ownerPlayerId) {
    return errorResponse("Unauthorized", 403);
  }

  const updated = await gameService.advanceToPlaying(gameId);
  if (!updated) {
    return errorResponse("Game cannot be advanced", 409);
  }

  return Response.json({ status: ServerResponseStatus.Success });
}
