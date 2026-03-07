import { ServerResponseStatus } from "@/server/models";
import { authenticateLobby } from "@/server/api-helpers";
import { toPublicLobby } from "@/server/lobby-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = authenticateLobby(lobbyId, sessionId);
  if (auth instanceof Response) return auth;

  return Response.json({
    status: ServerResponseStatus.Success,
    data: toPublicLobby(auth.lobby),
  });
}
