import { ServerResponseStatus } from "@/server/models";
import { lobbyService } from "@/services/LobbyService";
import { isValidSession, toPublicLobby } from "@/server/lobby-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;
  const lobby = lobbyService.getLobby(lobbyId);

  if (!lobby || !sessionId || !isValidSession(lobby, sessionId)) {
    return Response.json(
      { status: ServerResponseStatus.Error, error: "Lobby not found" },
      { status: 404 },
    );
  }

  return Response.json({
    status: ServerResponseStatus.Success,
    data: toPublicLobby(lobby),
  });
}
