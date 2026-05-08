import { randomUUID } from "crypto";
import { ServerResponseStatus } from "@/server/types";
import type { CreateNoDevicePlayerRequest } from "@/server/types";
import { addPlayer, validatePlayerJoin } from "@/server/lobby";
import {
  authenticateLobby,
  errorResponse,
  normalizeDisplayName,
  toPublicLobby,
  validatePlayerName,
} from "@/server/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> },
): Promise<Response> {
  const { lobbyId } = await params;
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  const auth = await authenticateLobby(lobbyId, sessionId, {
    requireOwner: true,
    requireNoGame: true,
  });
  if (auth instanceof Response) return auth;
  const { lobby } = auth;

  const body = (await request.json()) as Partial<CreateNoDevicePlayerRequest>;
  const rawPlayerName =
    typeof body.playerName === "string" ? body.playerName : "";
  const displayName = normalizeDisplayName(rawPlayerName);
  const nameError = validatePlayerName(displayName);
  if (nameError) {
    return errorResponse(nameError, 400);
  }

  const joinError = validatePlayerJoin(lobby, displayName);
  if (joinError) {
    return errorResponse(joinError, 400);
  }

  const newPlayer = {
    id: randomUUID(),
    name: displayName,
    noDevice: true as const,
  };

  const updated = await addPlayer(lobbyId, newPlayer);
  if (!updated) {
    return errorResponse("Failed to add player", 500);
  }

  return Response.json(
    {
      status: ServerResponseStatus.Success,
      data: { lobby: toPublicLobby(updated, sessionId) },
    },
    { status: 201 },
  );
}
