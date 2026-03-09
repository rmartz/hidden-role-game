import { GameMode } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import type { UpdateLobbyConfigRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { toPublicLobby } from "@/server/lobby-helpers";
import { authenticateLobby, errorResponse } from "@/server/api-helpers";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateLobby(lobbyId, sessionId, {
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

  if (body.roleSlots !== undefined && body.gameMode !== undefined) {
    const validRoleIds = new Set(
      Object.keys(gameService.getModeDefinition(body.gameMode).roles),
    );
    for (const slot of body.roleSlots) {
      if (!validRoleIds.has(slot.roleId)) {
        return errorResponse(`Unknown role: ${slot.roleId}`, 400);
      }
    }
  }

  const updated = lobbyService.updateConfig(lobbyId, body);
  if (!updated) {
    return errorResponse("Failed to update config", 500);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
