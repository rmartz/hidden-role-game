import { randomUUID } from "crypto";
import { ServerResponseStatus, type JoinLobbyRequest } from "@/server/types";
import { getLobby, addPlayer } from "@/server/lobby";
import {
  errorResponse,
  normalizePlayerName,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";

const MAX_LOBBY_PLAYERS = 100;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const body = (await request.json()) as JoinLobbyRequest;

  const displayName = body.playerName.trim().replace(/\s+/g, " ");
  const nameError = validatePlayerName(displayName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const lobby = await getLobby(lobbyId);

  if (!lobby) {
    return errorResponse("Lobby not found", 404);
  }

  if (lobby.players.length >= MAX_LOBBY_PLAYERS) {
    return errorResponse("Lobby is full", 400);
  }

  const normalizedNew = normalizePlayerName(displayName);
  const isDuplicate = lobby.players.some(
    (p) => normalizePlayerName(p.name) === normalizedNew,
  );
  if (isDuplicate) {
    return errorResponse(
      "A player with that name is already in the lobby",
      400,
    );
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
