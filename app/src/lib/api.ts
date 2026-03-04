import type {
  ServerResponse,
  PublicLobby,
  LobbyJoinResponse,
} from "@/server/models";

const SESSION_KEY = "x-session-id";

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

function saveSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

export type { PublicLobbyPlayer } from "@/server/models";

export async function createLobby(
  playerName: string,
): Promise<ServerResponse<LobbyJoinResponse>> {
  const response = await fetch("/api/lobby/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  const data: ServerResponse<LobbyJoinResponse> = await response.json();
  if (data.status === "success") {
    saveSessionId(data.data.sessionId);
  }
  return data;
}

export async function getLobby(
  lobbyId: string,
): Promise<ServerResponse<PublicLobby>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = {};
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/lobby/${lobbyId}`, { headers });
  return response.json();
}

export async function joinLobby(
  lobbyId: string,
  playerName: string,
): Promise<ServerResponse<LobbyJoinResponse>> {
  const response = await fetch(`/api/lobby/${lobbyId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  const data: ServerResponse<LobbyJoinResponse> = await response.json();
  if (data.status === "success") {
    saveSessionId(data.data.sessionId);
  }
  return data;
}
