export interface PublicLobbyPlayer {
  id: string;
  name: string;
}

export interface PublicLobby {
  id: string;
  ownerPlayerId: string;
  players: PublicLobbyPlayer[];
  gameId?: string;
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
  playerId: string;
}
