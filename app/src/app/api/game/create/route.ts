import { GameMode } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import type { CreateGameRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { toPublicLobby } from "@/server/lobby-helpers";
import { authenticateLobby, errorResponse } from "@/server/api-helpers";

export async function POST(request: Request): Promise<Response> {
  const sessionId = request.headers.get("x-session-id") ?? undefined;
  const { lobbyId, roleSlots, gameMode }: CreateGameRequest =
    await request.json();

  if (!Object.values(GameMode).includes(gameMode)) {
    return errorResponse("Unknown game mode", 400);
  }

  const auth = authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

  const totalSlots = roleSlots.reduce((sum, s) => sum + s.count, 0);
  if (totalSlots !== lobby.players.length) {
    return errorResponse("Role slot count must match player count", 400);
  }

  const validRoleIds = new Set(
    gameService.getRoleDefinitions(gameMode).map((r) => r.id),
  );
  for (const slot of roleSlots) {
    if (!validRoleIds.has(slot.roleId)) {
      return errorResponse(`Unknown role: ${slot.roleId}`, 400);
    }
  }

  const game = gameService.createGame(
    lobbyId,
    lobby.players,
    roleSlots,
    gameMode,
    lobby.config.showRolesInPlay,
  );
  const updated = lobbyService.setGameId(lobbyId, game.id);
  if (!updated) {
    return errorResponse("Failed to start game", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
