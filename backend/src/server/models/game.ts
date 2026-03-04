import type {
  GameStatusState,
  PrivatePlayerState,
  PublicPlayerState,
} from "../../lib/models";

export interface PublicPlayer {
  publicState: PublicPlayerState;
  privateState?: PrivatePlayerState; // only present for the requesting player
}

export interface PublicGame {
  status: GameStatusState;
  players: PublicPlayer[];
}

export interface PublicLobbyPlayer {
  id: string;
  name: string;
  sessionId?: string; // only present for the requesting player
}

export interface PublicLobby {
  id: string;
  players: PublicLobbyPlayer[];
  game?: PublicGame;
}
