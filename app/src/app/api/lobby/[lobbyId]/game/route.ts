import { ServerResponseStatus } from "@/server/models";
import type {
  PlayerGameState,
  PublicRoleInfo,
  VisibleTeammate,
} from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { isValidSession } from "@/server/lobby-helpers";
import { ROLE_DEFINITIONS } from "@/lib/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;
  const lobby = lobbyService.getLobby(lobbyId);

  if (!lobby) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Lobby not found" },
      { status: 404 },
    );
  }

  if (!sessionId || !isValidSession(lobby, sessionId)) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Unauthorized" },
      { status: 403 },
    );
  }

  if (!lobby.game) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Game not started" },
      { status: 404 },
    );
  }

  const caller = lobby.players.find((p) => p.sessionId === sessionId);
  if (!caller) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Player not found" },
      { status: 404 },
    );
  }

  const { game } = lobby;
  const myAssignment = game.roleAssignments.find(
    (r) => r.playerId === caller.id,
  );
  if (!myAssignment) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Role not assigned" },
      { status: 500 },
    );
  }

  const myRoleDef = ROLE_DEFINITIONS.find(
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
      const roleDef = ROLE_DEFINITIONS.find(
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
