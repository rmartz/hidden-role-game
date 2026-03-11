import { randomUUID } from "crypto";
import {
  GameMode,
  RoleConfigMode,
  ShowRolesInPlay,
  type LobbyPlayer,
} from "@/lib/types";
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

  const lobbyId = randomUUID();

  if (lobbyService.getLobby(lobbyId)) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "An unknown error occurred",
      },
      { status: 500 },
    );
  }

  const sessionId = randomUUID();
  const owner: LobbyPlayer = {
    id: randomUUID(),
    name: body.playerName,
    sessionId,
  };

  const defaultGameMode = GameMode.SecretVillain;
  const lobby = {
    id: lobbyId,
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

  lobbyService.addLobby(lobby);
  return Response.json({
    status: ServerResponseStatus.Success,
    data: {
      lobby: toPublicLobby(lobby, sessionId),
      sessionId,
      playerId: owner.id,
    },
  });
}
