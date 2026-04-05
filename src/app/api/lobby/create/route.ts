import { randomUUID } from "crypto";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import {
  DEFAULT_GAME_MODE,
  getDefaultRoleSlots,
  isGameModeEnabled,
  parseGameMode,
  GAME_MODES,
} from "@/lib/game-modes";
import { ServerResponseStatus, type CreateLobbyRequest } from "@/server/types";
import { lobbyService } from "@/services/FirebaseLobbyService";
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
  const lobby = {
    id: randomUUID(),
    ownerSessionId: sessionId,
    players: [owner],
    config: {
      gameMode: selectedGameMode,
      roleConfigMode: RoleConfigMode.Default,
      roleSlots: getDefaultRoleSlots(selectedGameMode, 1),
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlay.ConfiguredOnly,
      timerConfig: GAME_MODES[selectedGameMode].defaultTimerConfig,
      modeConfig: GAME_MODES[selectedGameMode].defaultModeConfig,
    },
    readyPlayerIds: [] as string[],
  };

  await lobbyService.addLobby(lobby);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: {
      lobby: toPublicLobby(lobby, sessionId),
      sessionId,
      playerId: owner.id,
    },
  });
}
