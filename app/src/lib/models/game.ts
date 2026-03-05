export interface LobbyPlayer {
  id: string;
  name: string;
  sessionId: string;
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

// --- Roles ---

export enum Team {
  Good = "Good",
  Bad = "Bad",
}

export interface RoleDefinition {
  id: string;
  name: string;
  team: Team;
  canSeeTeammates: boolean;
  knownToTeammates: boolean;
}

export interface PlayerRoleAssignment {
  playerId: string;
  roleDefinitionId: string;
}

// --- Game (exists only after the game has been started) ---

export interface Game {
  status: GameStatusState;
  players: LobbyPlayer[];
  roleAssignments: PlayerRoleAssignment[];
}

// --- Lobby (top-level entity; game is absent until started) ---

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  game?: Game;
}
