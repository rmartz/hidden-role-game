import { GameMode } from "@/lib/models";
import { ServerResponseStatus } from "@/server/models";
import type { UpdateLobbyConfigRequest } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { gameService } from "@/services/GameService";
import { isValidSession, toPublicLobby } from "@/server/lobby-helpers";

export async function PUT(
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

  if (lobby.ownerSessionId !== sessionId) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Only the owner can update the configuration",
      },
      { status: 403 },
    );
  }

  if (lobby.gameId) {
    return Response.json(
      {
        status: ServerResponseStatus.Error,
        error: "Cannot update configuration after the game has started",
      },
      { status: 409 },
    );
  }

  const body: UpdateLobbyConfigRequest = await request.json();

  if (
    body.gameMode !== undefined &&
    !Object.values(GameMode).includes(body.gameMode)
  ) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Unknown game mode" },
      { status: 400 },
    );
  }

  if (body.roleSlots !== undefined && body.gameMode !== undefined) {
    const validRoleIds = new Set(
      gameService.getRoleDefinitions(body.gameMode).map((r) => r.id),
    );
    for (const slot of body.roleSlots) {
      if (!validRoleIds.has(slot.roleId)) {
        return Response.json(
          {
            status: ServerResponseStatus.Error,
            error: `Unknown role: ${slot.roleId}`,
          },
          { status: 400 },
        );
      }
    }
  }

  const updated = lobbyService.updateConfig(lobbyId, body);
  if (!updated) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Failed to update config" },
      { status: 500 },
    );
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
