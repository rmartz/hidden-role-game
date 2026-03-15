import type { GameMode } from "@/lib/types";
import type {
  ServerResponse,
  PublicLobby,
  LobbyJoinResponse,
  RoleSlot,
  PlayerGameState,
  UpdateLobbyConfigRequest,
} from "@/server/types";
import { ServerResponseStatus } from "@/server/types";

const SESSION_KEY = "x-session-id";
const PLAYER_ID_KEY = "player-id";
const LOBBY_ID_KEY = "lobby-id";

export function getSessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(SESSION_KEY) ?? undefined;
}

function saveSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function getPlayerId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(PLAYER_ID_KEY) ?? undefined;
}

function savePlayerId(playerId: string): void {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
}

export function getLobbyId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(LOBBY_ID_KEY) ?? undefined;
}

function saveLobbyId(lobbyId: string): void {
  localStorage.setItem(LOBBY_ID_KEY, lobbyId);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(LOBBY_ID_KEY);
}

function saveJoinData(
  sessionId: string,
  playerId: string,
  lobbyId: string,
): void {
  saveSessionId(sessionId);
  savePlayerId(playerId);
  saveLobbyId(lobbyId);
}

export type { PublicLobbyPlayer } from "@/server/types";

export async function createLobby(
  playerName: string,
): Promise<ServerResponse<LobbyJoinResponse>> {
  const response = await fetch("/api/lobby/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  const data = (await response.json()) as ServerResponse<LobbyJoinResponse>;
  if (data.status === ServerResponseStatus.Success) {
    saveJoinData(data.data.sessionId, data.data.playerId, data.data.lobby.id);
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
  const data = (await response.json()) as ServerResponse<PublicLobby>;
  return { data, httpStatus: response.status };
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
  const data = (await response.json()) as ServerResponse<LobbyJoinResponse>;
  if (data.status === ServerResponseStatus.Success) {
    saveJoinData(data.data.sessionId, data.data.playerId, data.data.lobby.id);
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
  return (await response.json()) as ServerResponse<{ lobby: PublicLobby }>;
}

export async function startGame(
  lobbyId: string,
  roleSlots: RoleSlot[],
  gameMode: GameMode,
): Promise<ServerResponse<{ lobby: PublicLobby }>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch("/api/game/create", {
    method: "POST",
    headers,
    body: JSON.stringify({ lobbyId, roleSlots, gameMode }),
  });
  return (await response.json()) as ServerResponse<{ lobby: PublicLobby }>;
}

export async function advanceGame(
  gameId: string,
): Promise<ServerResponse<Record<string, never>>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/game/${gameId}/advance`, {
    method: "POST",
    headers,
  });
  return (await response.json()) as ServerResponse<Record<string, never>>;
}

export async function applyGameAction(
  gameId: string,
  actionId: string,
  payload?: unknown,
): Promise<ServerResponse<Record<string, never>>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/game/${gameId}/action`, {
    method: "POST",
    headers,
    body: JSON.stringify({ actionId, payload }),
  });
  return (await response.json()) as ServerResponse<Record<string, never>>;
}

export async function getGameState(
  gameId: string,
): Promise<{ data: ServerResponse<PlayerGameState>; httpStatus: number }> {
  const sessionId = getSessionId();
  const headers: HeadersInit = {};
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/game/${gameId}`, { headers });
  const data = (await response.json()) as ServerResponse<PlayerGameState>;
  return { data, httpStatus: response.status };
}

export async function updateLobbyConfig(
  lobbyId: string,
  config: UpdateLobbyConfigRequest,
): Promise<ServerResponse<{ lobby: PublicLobby }>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/lobby/${lobbyId}/config`, {
    method: "PUT",
    headers,
    body: JSON.stringify(config),
  });
  return (await response.json()) as ServerResponse<{ lobby: PublicLobby }>;
}

export async function removePlayer(
  lobbyId: string,
  playerId: string,
): Promise<ServerResponse<{ lobby: PublicLobby | undefined }>> {
  const sessionId = getSessionId();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (sessionId) headers["x-session-id"] = sessionId;
  const response = await fetch(`/api/lobby/${lobbyId}/players/${playerId}`, {
    method: "DELETE",
    headers,
  });
  return (await response.json()) as ServerResponse<{
    lobby: PublicLobby | undefined;
  }>;
}
