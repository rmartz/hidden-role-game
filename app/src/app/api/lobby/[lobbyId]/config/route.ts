import { GameMode } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import type { UpdateLobbyConfigRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import {
  authenticateLobby,
  errorResponse,
  toPublicLobby,
} from "@/server/utils";
import { lobbyBroadcastService } from "@/services/LobbyBroadcastService";
import { LobbyChangeReason } from "@/server/models/websocket";

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
    const { roles } = gameService.getModeDefinition(body.gameMode);
    for (const slot of body.roleSlots) {
      if (!(slot.roleId in roles)) {
        return errorResponse(`Unknown role: ${slot.roleId}`, 400);
      }
    }
  }

  const updated = lobbyService.updateConfig(lobbyId, body);
  if (!updated) {
    return errorResponse("Failed to update config", 500);
  }

  lobbyBroadcastService.broadcast(lobbyId, LobbyChangeReason.ConfigChanged);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
