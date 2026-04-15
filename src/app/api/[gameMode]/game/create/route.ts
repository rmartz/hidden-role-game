import { ServerResponseStatus } from "@/server/types";
import type { CreateGameRequest } from "@/server/types";
import { startLobbyGame } from "@/server/lobby";
import { createGame, validateGameStartPrerequisites } from "@/server/game";
import {
  authenticateLobby,
  errorResponse,
  parseGameMode,
  toPublicLobby,
  validateRoleBucketsCoverPlayerCount,
  validateRoleBucketsForMode,
} from "@/server/utils";
import { isGameModeEnabled } from "@/lib/game/modes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameMode: string }> },
): Promise<Response> {
  const { gameMode: gameModeParam } = await params;
  const gameMode = parseGameMode(gameModeParam);
  if (!gameMode) return errorResponse("Unknown game mode", 400);
  if (!isGameModeEnabled(gameMode))
    return errorResponse("Game mode is not available", 400);

  const sessionId = request.headers.get("x-session-id") ?? undefined;
  const { lobbyId } = (await request.json()) as CreateGameRequest;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

  const prereqs = validateGameStartPrerequisites(lobby, gameMode);
  if ("error" in prereqs) {
    return errorResponse(prereqs.error, 409);
  }

  const buckets = lobby.config.roleBuckets;

  const bucketModeError = validateRoleBucketsForMode(buckets, gameMode);
  if (bucketModeError) return errorResponse(bucketModeError, 400);

  const bucketCoverError = validateRoleBucketsCoverPlayerCount(
    buckets,
    gameMode,
    lobby.players.length,
  );
  if (bucketCoverError) return errorResponse(bucketCoverError, 400);

  const game = await createGame(
    lobbyId,
    lobby.players,
    buckets,
    gameMode,
    lobby.config.showRolesInPlay,
    prereqs.ownerPlayerId,
    lobby.config.timerConfig,
    lobby.config.modeConfig,
    lobby.playerOrder,
  );

  const updated = await startLobbyGame(lobbyId, game.id);
  if (!updated) {
    return errorResponse("Failed to start game", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
