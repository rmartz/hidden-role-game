import { ServerResponseStatus } from "@/server/models";
import type {
  PlayerGameState,
  PublicRoleInfo,
  VisibleTeammate,
} from "@/server/models";
import { gameService } from "@/services/GameService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  const { gameId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;
  if (!sessionId) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "No session" },
      { status: 401 },
    );
  }

  const game = gameService.getGame(gameId);
  const caller = game?.players.find((p) => p.sessionId === sessionId);

  if (!game || !caller) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Forbidden" },
      { status: 403 },
    );
  }

  const roleDefs = gameService.getRoleDefinitions(game.gameMode);

  const myAssignment = game.roleAssignments.find(
    (r) => r.playerId === caller.id,
  );
  if (!myAssignment) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Role not assigned" },
      { status: 500 },
    );
  }

  const myRoleDef = roleDefs.find(
    (r) => r.id === myAssignment.roleDefinitionId,
  );
  if (!myRoleDef) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Role definition not found",
      },
      { status: 500 },
    );
  }

  const myRole: PublicRoleInfo = {
    id: myRoleDef.id,
    name: myRoleDef.name,
    team: myRoleDef.team,
  };

  const visibleTeammates: VisibleTeammate[] = [];
  if (myRoleDef.canSeeTeammates) {
    for (const assignment of game.roleAssignments) {
      if (assignment.playerId === caller.id) continue;
      const roleDef = roleDefs.find(
        (r) => r.id === assignment.roleDefinitionId,
      );
      if (!roleDef?.knownToTeammates) continue;
      const player = game.players.find((p) => p.id === assignment.playerId);
      if (!player) continue;
      visibleTeammates.push({
        player: { id: player.id, name: player.name },
        role: { id: roleDef.id, name: roleDef.name, team: roleDef.team },
      });
    }
  }

  const gameState: PlayerGameState = {
    status: game.status,
    players: game.players.map((p) => ({ id: p.id, name: p.name })),
    myRole,
    visibleTeammates,
  };

  return Response.json({
    status: ServerResponseStatus.Success,
    data: gameState,
  });
}
