import { ServerResponseStatus } from "@/server/types";
import type { CreateGameRequest } from "@/server/types";
import { startLobbyGame } from "@/server/lobby";
import { createGame, validateGameStartPrerequisites } from "@/server/game";
import {
  authenticateLobby,
  errorResponse,
  parseGameMode,
  toPublicLobby,
  validateRoleSlotsForMode,
  validateRoleSlotsCoverPlayerCount,
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

  const roleSlots = lobby.config.roleSlots;

  const coverError = validateRoleSlotsCoverPlayerCount(
    roleSlots,
    gameMode,
    lobby.players.length,
  );
  if (coverError) return errorResponse(coverError, 400);

  const modeError = validateRoleSlotsForMode(roleSlots, gameMode);
  if (modeError) return errorResponse(modeError, 400);

  const game = await createGame(
    lobbyId,
    lobby.players,
    roleSlots,
    gameMode,
    lobby.config.showRolesInPlay,
    prereqs.ownerPlayerId,
    lobby.config.timerConfig,
    lobby.config.modeConfig,
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
