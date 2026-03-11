import { randomUUID } from "crypto";
import type { LobbyPlayer } from "@/lib/types";
import { ServerResponseStatus, type JoinLobbyRequest } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
import { errorResponse, toPublicLobby } from "@/server/utils";
import { lobbyBroadcastService } from "@/services/LobbyBroadcastService";
import { LobbyChangeReason } from "@/server/types/websocket";

const MAX_PLAYER_NAME_LENGTH = 32;
const MAX_LOBBY_PLAYERS = 100;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const body = (await request.json()) as JoinLobbyRequest;

  if (
    !body.playerName ||
    body.playerName.length === 0 ||
    body.playerName.length > MAX_PLAYER_NAME_LENGTH
  ) {
    return errorResponse(
      `Player name must be between 1 and ${String(MAX_PLAYER_NAME_LENGTH)} characters`,
      400,
    );
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
