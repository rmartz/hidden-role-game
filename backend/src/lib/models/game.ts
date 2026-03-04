// --- Lobby Players (flat, no public/private split) ---

export interface LobbyPlayer {
  id: string;
  name: string;
  sessionId: string;
}

// --- Game Players (structured state, once game exists) ---

export interface PublicPlayerState {
  id: string;
  name: string;
}

export interface PrivatePlayerState {
  sessionId: string;
}

export interface Player {
  publicState: PublicPlayerState;
  privateState: PrivatePlayerState;
}

// --- Game Status (no Lobby — Lobby is a separate concept) ---

export enum GameStatus {
  Starting = "Starting",
  Playing = "Playing",
  Finished = "Finished",
}

export interface StartingGameStatus {
  type: GameStatus.Starting;
}

export interface PlayingGameStatus {
  type: GameStatus.Playing;
}

export interface FinishedGameStatus {
  type: GameStatus.Finished;
}

export type GameStatusState =
  | StartingGameStatus
  | PlayingGameStatus
  | FinishedGameStatus;

// --- Game (exists only after the game has been started) ---

export interface Game {
  status: GameStatusState;
  players: Player[];
}

// --- Lobby (top-level entity; game is absent until started) ---

export interface Lobby {
  id: string;
  players: LobbyPlayer[];
  game?: Game;
}

// --- Public-facing API types ---

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
