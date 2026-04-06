import { GameStatus } from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import { clearGameId } from "@/lib/firebase/lobby";
import { getGame } from "@/server/game";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId);
  if (auth instanceof Response) return auth;

  const { gameId } = auth.lobby;
  if (!gameId) {
    return errorResponse("No active game", 409);
  }

  const game = await getGame(gameId);
  if (game?.status.type !== GameStatus.Finished) {
    return errorResponse("Game is still in progress", 409);
  }

  const updated = await clearGameId(lobbyId);
  if (!updated) {
    return errorResponse("Failed to return to lobby", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
