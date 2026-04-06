import { randomUUID } from "crypto";
import { ServerResponseStatus, type JoinLobbyRequest } from "@/server/types";
import { getLobby, addPlayer, validatePlayerJoin } from "@/server/lobby";
import {
  errorResponse,
  normalizeDisplayName,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const body = (await request.json()) as JoinLobbyRequest;

  const displayName = normalizeDisplayName(body.playerName);
  const nameError = validatePlayerName(displayName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const lobby = await getLobby(lobbyId);

  if (!lobby) {
    return errorResponse("Lobby not found", 404);
  }

  const joinError = validatePlayerJoin(lobby, displayName);
  if (joinError) {
    return errorResponse(joinError, 400);
  }

  const sessionId = randomUUID();
  const newPlayer = {
    id: randomUUID(),
    name: displayName,
    sessionId,
  };

  const updated = await addPlayer(lobbyId, newPlayer);
  if (!updated) {
    return errorResponse("Failed to join lobby", 500);
  }

  return Response.json(
    {
      status: ServerResponseStatus.Success,
      data: {
        lobby: toPublicLobby(updated, sessionId),
        sessionId,
        playerId: newPlayer.id,
      },
    },
    { status: 201 },
  );
}
