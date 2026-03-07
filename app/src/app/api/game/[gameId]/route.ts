import { ServerResponseStatus } from "@/server/models";
import type { PlayerGameState, PublicRoleInfo } from "@/server/models";
import { gameService } from "@/services/GameService";
import { authenticateGame, errorResponse } from "@/server/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<Response> {
  const { gameId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateGame(gameId, sessionId);
  if (auth instanceof Response) return auth;
  const { game, caller } = auth;

  const roleDefs = gameService.getRoleDefinitions(game.gameMode);

  const myAssignment = game.roleAssignments.find(
    (r) => r.playerId === caller.id,
  );
  if (!myAssignment) {
    return errorResponse("Role not assigned", 500);
  }

  const myRoleDef = roleDefs.find(
    (r) => r.id === myAssignment.roleDefinitionId,
  );
  if (!myRoleDef) {
    return errorResponse("Role definition not found", 500);
  }

  const myRole: PublicRoleInfo = {
    id: myRoleDef.id,
    name: myRoleDef.name,
    team: myRoleDef.team,
  };

  const playerById = new Map(game.players.map((p) => [p.id, p]));
  const roleDefById = new Map(roleDefs.map((r) => [r.id, r]));
  const visibleTeammates = caller.visibleRoles.flatMap((assignment) => {
    const player = playerById.get(assignment.playerId);
    const roleDef = roleDefById.get(assignment.roleDefinitionId);
    if (!player || !roleDef) return [];
    return [
      {
        player: { id: player.id, name: player.name },
        role: { id: roleDef.id, name: roleDef.name, team: roleDef.team },
      },
    ];
  });

  const rolesInPlay: PublicRoleInfo[] | null = game.showRolesInPlay
    ? game.roleAssignments.reduce<PublicRoleInfo[]>((acc, assignment) => {
        const def = roleDefById.get(assignment.roleDefinitionId);
        if (!def || acc.some((r) => r.id === def.id)) return acc;
        return [...acc, { id: def.id, name: def.name, team: def.team }];
      }, [])
    : null;

  const gameState: PlayerGameState = {
    status: game.status,
    players: game.players.map((p) => ({ id: p.id, name: p.name })),
    myRole,
    visibleTeammates,
    rolesInPlay,
  };

  return Response.json({
    status: ServerResponseStatus.Success,
    data: gameState,
  });
}
