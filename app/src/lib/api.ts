import type {
  ServerResponse,
  PublicLobby,
  LobbyJoinResponse,
  RoleSlot,
  PlayerGameState,
} from "@/server/models";

const SESSION_KEY = "x-session-id";
const PLAYER_ID_KEY = "player-id";

function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

function saveSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function getPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAYER_ID_KEY);
}

function savePlayerId(playerId: string): void {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
}

function saveJoinData(sessionId: string, playerId: string): void {
  saveSessionId(sessionId);
  savePlayerId(playerId);
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
    saveJoinData(data.data.sessionId, data.data.playerId);
  }
  return data;
}

export async function getLobby(
  lobbyId: string,
): Promise<{ data: ServerResponse<PublicLobby>; httpStatus: number }> {
  const sessionId = getSessionId();
  const headers: HeadersInit = {};
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/lobby/${lobbyId}`, { headers });
  return { data: await response.json(), httpStatus: response.status };
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
    saveJoinData(data.data.sessionId, data.data.playerId);
  }
  return data;
}

export async function transferOwner(
  lobbyId: string,
  playerId: string,
): Promise<ServerResponse<{ lobby: PublicLobby }>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/lobby/${lobbyId}/owner`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ playerId }),
  });
  return response.json();
}

export async function startGame(
  lobbyId: string,
  roleSlots: RoleSlot[],
): Promise<ServerResponse<{ lobby: PublicLobby }>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch("/api/game/create", {
    method: "POST",
    headers,
    body: JSON.stringify({ lobbyId, roleSlots }),
  });
  return response.json();
}

export async function getGameState(
  gameId: string,
): Promise<{ data: ServerResponse<PlayerGameState>; httpStatus: number }> {
  const sessionId = getSessionId();
  const headers: HeadersInit = {};
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/game/${gameId}`, { headers });
  return { data: await response.json(), httpStatus: response.status };
}

export async function removePlayer(
  lobbyId: string,
  playerId: string,
): Promise<ServerResponse<{ lobby: PublicLobby | null }>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/lobby/${lobbyId}/players/${playerId}`, {
    method: "DELETE",
    headers,
  });
  return response.json();
}
