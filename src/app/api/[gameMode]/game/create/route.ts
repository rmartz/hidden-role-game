import { ServerResponseStatus } from "@/server/types";
import type { CreateGameRequest } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import {
  authenticateLobby,
  errorResponse,
  parseGameMode,
  toPublicLobby,
} from "@/server/utils";
import { getRoleSlotsRequired, isGameModeEnabled } from "@/lib/game-modes";

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

  if (lobby.config.gameMode !== gameMode) {
    return errorResponse("Game mode does not match lobby configuration", 409);
  }

  const roleSlots = lobby.config.roleSlots;

  const roleSlotsRequired = getRoleSlotsRequired(
    gameMode,
    lobby.players.length,
  );
  const totalMin = roleSlots.reduce((sum, s) => sum + s.min, 0);
  const totalMax = roleSlots.reduce((sum, s) => sum + s.max, 0);
  if (totalMin > roleSlotsRequired || totalMax < roleSlotsRequired) {
    return errorResponse("Role slot ranges must cover the player count", 400);
  }

  const { ownerTitle, roles } = gameService.getModeDefinition(gameMode);
  for (const slot of roleSlots) {
    if (!(slot.roleId in roles)) {
      return errorResponse(`Unknown role: ${slot.roleId}`, 400);
    }
  }

  const ownerPlayer = ownerTitle
    ? lobby.players.find((p) => p.sessionId === lobby.ownerSessionId)
    : undefined;

  const game = await gameService.createGame(
    lobbyId,
    lobby.players,
    roleSlots,
    gameMode,
    lobby.config.showRolesInPlay,
    ownerPlayer?.id ?? undefined,
    lobby.config.timerConfig,
    lobby.config.modeConfig,
  );

  await lobbyService.clearReadyPlayerIds(lobbyId);
  const updated = await lobbyService.setGameId(lobbyId, game.id);
  if (!updated) {
    return errorResponse("Failed to start game", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
