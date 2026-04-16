import { GameMode } from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import type { UpdateLobbyConfigRequest } from "@/server/types";
import { updateConfig } from "@/server/lobby";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
  validateRoleBucketsForMode,
} from "@/server/utils";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;

  const body = (await request.json()) as UpdateLobbyConfigRequest;

  if (
    body.gameMode !== undefined &&
    !Object.values(GameMode).includes(body.gameMode)
  ) {
    return errorResponse("Unknown game mode", 400);
  }

  if (body.roleBuckets !== undefined) {
    const bucketGameMode = body.gameMode ?? auth.lobby.config.gameMode;
    const bucketError = validateRoleBucketsForMode(
      body.roleBuckets,
      bucketGameMode,
    );
    if (bucketError) return errorResponse(bucketError, 400);
  }

  const updated = await updateConfig(lobbyId, body);
  if (!updated) {
    return errorResponse("Failed to update config", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
