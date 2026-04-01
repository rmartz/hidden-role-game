import { randomUUID } from "crypto";
import {
  GameMode,
  RoleConfigMode,
  ShowRolesInPlay,
  DEFAULT_TIMER_CONFIG,
} from "@/lib/types";
import { getDefaultRoleSlots, parseGameMode } from "@/lib/game-modes";
import { ServerResponseStatus, type CreateLobbyRequest } from "@/server/types";
import { lobbyService } from "@/services/LobbyService";
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
    selectedGameMode = parsed;
  } else {
    selectedGameMode = GameMode.SecretVillain;
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
      nominationsEnabled: true,
      singleTrialPerDay: true,
      revealProtections: true,
      timerConfig: DEFAULT_TIMER_CONFIG,
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
