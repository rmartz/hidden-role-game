import { randomUUID } from "crypto";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import { getDefaultRoleSlots } from "@/lib/game-modes";
import { ServerResponseStatus, type CreateLobbyRequest } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
import {
  errorResponse,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as CreateLobbyRequest;

  const nameError = validatePlayerName(body.playerName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const sessionId = randomUUID();
  const owner = {
    id: randomUUID(),
    name: body.playerName,
    sessionId,
  };

  const defaultGameMode = GameMode.SecretVillain;
  const lobby = {
    id: randomUUID(),
    ownerSessionId: sessionId,
    players: [owner],
    config: {
      gameMode: defaultGameMode,
      roleConfigMode: RoleConfigMode.Default,
      roleSlots: getDefaultRoleSlots(defaultGameMode, 1),
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.None,
    },
  };

  await lobbyService.addLobby(lobby);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: {
      lobby: toPublicLobby(lobby, sessionId),
      sessionId,
      playerId: owner.id,
    },
  });
}
