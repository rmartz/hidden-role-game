import { randomUUID } from "crypto";
import type { LobbyPlayer } from "@/lib/models";
import { ServerResponseStatus, type CreateLobbyRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { toPublicLobby } from "@/server/lobby-helpers";

export async function POST(request: Request): Promise<Response> {
  const body: CreateLobbyRequest = await request.json();
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

  const lobby = {
    id: lobbyId,
    ownerSessionId: sessionId,
    players: [owner],
  };

  lobbyService.addLobby(lobby);
  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(lobby), sessionId },
  });
}
