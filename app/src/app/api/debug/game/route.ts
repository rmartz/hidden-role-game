import { randomUUID } from "crypto";
import { GameMode } from "@/lib/models";
import type { LobbyPlayer } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { ServerResponseStatus } from "@/server/models";
import { gameService } from "@/services/GameService";
import { errorResponse } from "@/server/utils";

interface CreateDebugGameRequest {
  playerCount: number;
  gameMode: GameMode;
  roleSlots: RoleSlot[];
  showRolesInPlay: boolean;
}

export interface DebugPlayer {
  id: string;
  name: string;
  sessionId: string;
  isOwner: boolean;
}

export async function POST(request: Request): Promise<Response> {
  const { playerCount, gameMode, roleSlots, showRolesInPlay } =
    (await request.json()) as CreateDebugGameRequest;

  if (!Object.values(GameMode).includes(gameMode)) {
    return errorResponse("Unknown game mode", 400);
  }

  if (playerCount < 2 || playerCount > 20) {
    return errorResponse("playerCount must be between 2 and 20", 400);
  }

  const { ownerTitle, roles } = gameService.getModeDefinition(gameMode);

  const players: LobbyPlayer[] = Array.from(
    { length: playerCount },
    (_, i) => ({
      id: randomUUID(),
      name: `Player ${String(i + 1)}`,
      sessionId: randomUUID(),
    }),
  );

  const ownerPlayer = ownerTitle ? players[0] : null;
  const roleSlotsRequired = playerCount - (ownerPlayer ? 1 : 0);
  const totalSlots = roleSlots.reduce((sum, s) => sum + s.count, 0);

  if (totalSlots !== roleSlotsRequired) {
    return errorResponse(
      `Role slot count (${String(totalSlots)}) must match player count (${String(roleSlotsRequired)})`,
      400,
    );
  }

  for (const slot of roleSlots) {
    if (!(slot.roleId in roles)) {
      return errorResponse(`Unknown role: ${slot.roleId}`, 400);
    }
  }

  const game = gameService.createGame(
    `debug-${randomUUID()}`,
    players,
    roleSlots,
    gameMode,
    showRolesInPlay,
    ownerPlayer?.id ?? null,
  );

  const debugPlayers: DebugPlayer[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    sessionId: p.sessionId,
    isOwner: p.id === (ownerPlayer?.id ?? null),
  }));

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { gameId: game.id, players: debugPlayers },
  });
}
