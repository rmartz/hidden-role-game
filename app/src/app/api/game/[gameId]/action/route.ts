import { ServerResponseStatus } from "@/server/models";
import { gameService } from "@/services/GameService";
import { authenticateGame, errorResponse } from "@/server/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  const { gameId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;
  const { caller } = auth;

  const body = (await request.json()) as {
    actionId?: unknown;
    payload?: unknown;
  };
  if (typeof body.actionId !== "string") {
    return errorResponse("actionId must be a string", 400);
  }

  const result = gameService.applyAction(
    gameId,
    body.actionId,
    caller.id,
    body.payload ?? null,
  );

  if ("error" in result) {
    return errorResponse(result.error, 409);
  }

  return Response.json({ status: ServerResponseStatus.Success });
}
