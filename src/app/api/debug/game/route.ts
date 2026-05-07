import { randomUUID } from "crypto";
import { GameMode, ShowRolesInPlay } from "@/lib/types";
import type {
  LobbyPlayer,
  ModeConfig,
  RoleBucket,
  TimerConfig,
} from "@/lib/types";
import { ServerResponseStatus } from "@/server/types";
import { getModeDefinition, createGame } from "@/server/game";
import {
  errorResponse,
  validateRoleBucketsForMode,
  validateRoleBucketsCoverPlayerCount,
} from "@/server/utils";
import { GAME_MODES } from "@/lib/game/modes";

interface CreateDebugGameRequest {
  playerCount: number;
  gameMode: GameMode;
  roleBuckets: RoleBucket[];
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
    roleBuckets,
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

  const coverError = validateRoleBucketsCoverPlayerCount(
    roleBuckets,
    gameMode,
    playerCount,
    resolvedModeConfig,
  );
  if (coverError) return errorResponse(coverError, 400);

  const modeError = validateRoleBucketsForMode(roleBuckets, gameMode);
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

  let game;
  try {
    game = await createGame(
      `debug-${randomUUID()}`,
      players,
      roleBuckets,
      gameMode,
      showRolesInPlay,
      ownerPlayer?.id ?? undefined,
      { ...GAME_MODES[gameMode].defaultTimerConfig, ...timerConfig },
      resolvedModeConfig,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[debug/game] createGame failed:", err);
    return Response.json({ error: message }, { status: 500 });
  }

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
