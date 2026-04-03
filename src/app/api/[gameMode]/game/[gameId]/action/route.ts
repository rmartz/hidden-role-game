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
  const { caller } = auth;

  if (auth.game.gameMode !== gameMode) {
    return errorResponse("Game mode mismatch", 409);
  }

  const body = (await request.json()) as {
    actionId?: unknown;
    payload?: unknown;
  };
  if (typeof body.actionId !== "string") {
    return errorResponse("actionId must be a string", 400);
  }

  const result = await gameService.applyAction(
    gameId,
    body.actionId,
    caller.id,
    body.payload,
  );

  if ("error" in result) {
    return errorResponse(result.error, 409);
  }

  return Response.json({ status: ServerResponseStatus.Success });
}
