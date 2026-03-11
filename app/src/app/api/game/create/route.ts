import { GameMode } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import type { CreateGameRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";
import { getRoleSlotsRequired } from "@/lib/game-modes";
import { lobbyBroadcastService } from "@/services/LobbyBroadcastService";
import { LobbyChangeReason } from "@/server/models/websocket";

export async function POST(request: Request): Promise<Response> {
  const sessionId = request.headers.get("x-session-id") ?? undefined;
  const { lobbyId, roleSlots, gameMode } =
    (await request.json()) as CreateGameRequest;

  if (!Object.values(GameMode).includes(gameMode)) {
    return errorResponse("Unknown game mode", 400);
  }

  const auth = authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

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
    ? (lobby.players.find((p) => p.sessionId === lobby.ownerSessionId) ?? null)
    : null;

  const game = gameService.createGame(
    lobbyId,
    lobby.players,
    roleSlots,
    gameMode,
    lobby.config.showRolesInPlay,
    ownerPlayer?.id ?? null,
  );
  const updated = lobbyService.setGameId(lobbyId, game.id);
  if (!updated) {
    return errorResponse("Failed to start game", 500);
  }

  lobbyBroadcastService.broadcast(lobbyId, LobbyChangeReason.GameStarted);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
