import type { GameStatusState } from "../../lib/models";

export interface PublicLobbyPlayer {
  id: string;
  name: string;
}

export interface PublicLobby {
  id: string;
  players: PublicLobbyPlayer[];
  game?: { status: GameStatusState; players: PublicLobbyPlayer[] };
}

export interface CreateLobbyRequest {
  playerName: string;
}

export interface JoinLobbyRequest {
  playerName: string;
}

export interface LobbyJoinResponse {
  lobby: PublicLobby;
  sessionId: string;
}
