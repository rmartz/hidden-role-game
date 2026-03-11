import { randomUUID } from "crypto";
import type { LobbyPlayer } from "@/lib/types";
import { ServerResponseStatus, type JoinLobbyRequest } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
import {
  errorResponse,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";
import { lobbyBroadcastService } from "@/services/LobbyBroadcastService";
import { LobbyChangeReason } from "@/server/types/websocket";

const MAX_LOBBY_PLAYERS = 100;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const body = (await request.json()) as JoinLobbyRequest;

  const nameError = validatePlayerName(body.playerName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const lobby = lobbyService.getLobby(lobbyId);

  if (!lobby) {
    return errorResponse("Lobby not found", 404);
  }

  if (lobby.players.length >= MAX_LOBBY_PLAYERS) {
    return errorResponse("Lobby is full", 400);
  }

  const sessionId = randomUUID();
  const newPlayer: LobbyPlayer = {
    id: randomUUID(),
    name: body.playerName,
    sessionId,
  };
  lobby.players.push(newPlayer);

  lobbyBroadcastService.broadcast(lobbyId, LobbyChangeReason.PlayerJoined);

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
