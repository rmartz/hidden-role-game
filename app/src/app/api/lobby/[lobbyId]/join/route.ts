import { randomUUID } from "crypto";
import type { LobbyPlayer } from "@/lib/models";
import { ServerResponseStatus, type JoinLobbyRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { toPublicLobby } from "@/server/lobby-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const body: JoinLobbyRequest = await request.json();
  const lobby = lobbyService.getLobby(lobbyId);

  if (!lobby) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Lobby not found" },
      { status: 404 },
    );
  }

  const sessionId = randomUUID();
  const newPlayer: LobbyPlayer = {
    id: randomUUID(),
    name: body.playerName,
    sessionId,
  };
  lobby.players.push(newPlayer);

  return Response.json(
    {
      status: ServerResponseStatus.Success,
      data: { lobby: toPublicLobby(lobby), sessionId },
    },
    { status: 201 },
  );
}
