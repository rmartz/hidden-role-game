import { randomUUID } from "crypto";
import { GameMode, ShowRolesInPlay } from "@/lib/types";
import type { LobbyPlayer, ModeConfig, TimerConfig } from "@/lib/types";
import type { RoleSlot } from "@/server/types";
import { ServerResponseStatus } from "@/server/types";
import { getModeDefinition, createGame } from "@/server/game";
import {
  errorResponse,
  validateRoleSlotsForMode,
  validateRoleSlotsCoverPlayerCount,
} from "@/server/utils";
import { GAME_MODES } from "@/lib/game/modes";

interface CreateDebugGameRequest {
  playerCount: number;
  gameMode: GameMode;
  roleSlots: RoleSlot[];
  showRolesInPlay: ShowRolesInPlay;
  timerConfig: TimerConfig;
  modeConfig?: ModeConfig;
}

export interface DebugPlayer {
  id: string;
  name: string;
  sessionId: string;
  isOwner: boolean;
}

export async function POST(request: Request): Promise<Response> {
  const {
    playerCount,
    gameMode,
    roleSlots,
    showRolesInPlay,
    timerConfig,
    modeConfig,
  } = (await request.json()) as CreateDebugGameRequest;

  if (!Object.values(GameMode).includes(gameMode)) {
    return errorResponse("Unknown game mode", 400);
  }

  if (playerCount < 2 || playerCount > 20) {
    return errorResponse("playerCount must be between 2 and 20", 400);
  }

  const resolvedModeConfig =
    modeConfig ?? GAME_MODES[gameMode].defaultModeConfig;

  const coverError = validateRoleSlotsCoverPlayerCount(
    roleSlots,
    gameMode,
    playerCount,
    resolvedModeConfig,
  );
  if (coverError) return errorResponse(coverError, 400);

  const modeError = validateRoleSlotsForMode(roleSlots, gameMode);
  if (modeError) return errorResponse(modeError, 400);

  const definition = getModeDefinition(gameMode);
  const ownerTitle =
    definition.resolveOwnerTitle?.(resolvedModeConfig) ?? definition.ownerTitle;

  const players: LobbyPlayer[] = Array.from(
    { length: playerCount },
    (_, i) => ({
      id: randomUUID(),
      name: `Player ${String(i + 1)}`,
      sessionId: randomUUID(),
    }),
  );

  const ownerPlayer = ownerTitle ? players[0] : undefined;

  const game = await createGame(
    `debug-${randomUUID()}`,
    players,
    roleSlots,
    gameMode,
    showRolesInPlay,
    ownerPlayer?.id ?? undefined,
    { ...GAME_MODES[gameMode].defaultTimerConfig, ...timerConfig },
    resolvedModeConfig,
  );

  const debugPlayers: DebugPlayer[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    sessionId: p.sessionId,
    isOwner: p.id === ownerPlayer?.id,
  }));

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { gameId: game.id, gameMode, players: debugPlayers },
  });
}
