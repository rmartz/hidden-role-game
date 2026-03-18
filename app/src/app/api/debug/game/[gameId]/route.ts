import { ServerResponseStatus } from "@/server/types";
import { gameService } from "@/services/GameService";
import { errorResponse } from "@/server/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  if (process.env["NEXT_PUBLIC_DEBUG_MODE"] !== "true") {
    return errorResponse("Not found", 404);
  }

  const { gameId } = await params;

  const game = await gameService.getGame(gameId);
  if (!game) {
    return errorResponse("Game not found", 404);
  }

  if (!game.lobbyId.startsWith("debug-")) {
    return errorResponse("Not a debug game", 403);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: game,
  });
}
