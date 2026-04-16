import { ServerResponseStatus } from "@/server/types";
import {
  authenticateLobby,
  errorResponse,
  normalizeDisplayName,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";
import type { UpdatePlayerNameRequest } from "@/server/types";
import {
  removePlayer,
  authorizePlayerRemoval,
  renamePlayer,
  validatePlayerRename,
} from "@/server/lobby";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string; playerId: string }> },
): Promise<Response> {
  const { lobbyId, playerId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

  const authError = authorizePlayerRemoval(lobby, playerId, auth.sessionId);
  if (authError) {
    return errorResponse(authError, 403);
  }

  const updated = await removePlayer(lobbyId, playerId);

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: updated ? toPublicLobby(updated, sessionId) : null },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string; playerId: string }> },
): Promise<Response> {
  const { lobbyId, playerId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

  const caller = lobby.players.find(
    (player) => player.sessionId === auth.sessionId,
  );
  if (caller?.id !== playerId) {
    return errorResponse("Unauthorized", 403);
  }

  const body = (await request.json()) as Partial<UpdatePlayerNameRequest>;
  const rawPlayerName =
    typeof body.playerName === "string" ? body.playerName : "";
  const displayName = normalizeDisplayName(rawPlayerName);
  const nameError = validatePlayerName(displayName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const renameError = validatePlayerRename(lobby, playerId, displayName);
  if (renameError) {
    return errorResponse(renameError, 400);
  }

  const updated = await renamePlayer(lobbyId, playerId, displayName);
  if (!updated) {
    return errorResponse("Player not found", 404);
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: { lobby: toPublicLobby(updated, sessionId) },
  });
}
