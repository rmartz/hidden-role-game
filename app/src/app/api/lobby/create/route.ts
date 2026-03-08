import { randomUUID } from "crypto";
import { GameMode, type LobbyPlayer } from "@/lib/models";
import { ServerResponseStatus, type CreateLobbyRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { toPublicLobby } from "@/server/lobby-helpers";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as CreateLobbyRequest;
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
      roleSlots: gameService.defaultRoleCount(defaultGameMode, 1),
      showConfigToPlayers: false,
      showRolesInPlay: false,
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
