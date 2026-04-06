import { randomUUID } from "crypto";
import { GameMode } from "@/lib/types";
import {
  DEFAULT_GAME_MODE,
  isGameModeEnabled,
  parseGameMode,
} from "@/lib/game-modes";
import { ServerResponseStatus, type CreateLobbyRequest } from "@/server/types";
import { addLobby } from "@/server/lobby";
import {
  errorResponse,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as CreateLobbyRequest;

  const displayName = body.playerName.trim().replace(/\s+/g, " ");
  const nameError = validatePlayerName(displayName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const sessionId = randomUUID();
  const owner = {
    id: randomUUID(),
    name: displayName,
    sessionId,
  };

  let selectedGameMode: GameMode;
  if (body.gameMode) {
    const parsed = parseGameMode(body.gameMode);
    if (!parsed) return errorResponse("Unknown game mode", 400);
    if (!isGameModeEnabled(parsed))
      return errorResponse("Game mode is not available", 400);
    selectedGameMode = parsed;
  } else {
    selectedGameMode = DEFAULT_GAME_MODE;
  }

  const lobby = await addLobby(owner, selectedGameMode);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: {
      lobby: toPublicLobby(lobby, sessionId),
      sessionId,
      playerId: owner.id,
    },
  });
}
