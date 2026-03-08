import { randomUUID } from "crypto";
import type { LobbyPlayer } from "@/lib/models";
import { ServerResponseStatus, type JoinLobbyRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { adjustRoleSlots } from "@/server/role-slots";
import { toPublicLobby } from "@/server/lobby-helpers";
import { errorResponse } from "@/server/api-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const body: JoinLobbyRequest = await request.json();
  const lobby = lobbyService.getLobby(lobbyId);

  if (!lobby) {
    return errorResponse("Lobby not found", 404);
  }

  const sessionId = randomUUID();
  const newPlayer: LobbyPlayer = {
    id: randomUUID(),
    name: body.playerName,
    sessionId,
  };
  lobby.players.push(newPlayer);
  const target = gameService.defaultRoleCount(
    lobby.config.gameMode,
    lobby.players.length,
  );
  lobby.config.roleSlots = adjustRoleSlots(
    lobby.config.roleSlots,
    target,
    "add",
  );

  return Response.json(
    {
      status: ServerResponseStatus.Success,
      data: {
        lobby: toPublicLobby(lobby, sessionId),
        sessionId,
        playerId: newPlayer.id,
      },
    },
    { status: 201 },
  );
}
