// --- Game Status (no Lobby — Lobby is a separate concept) ---

export enum GameStatus {
  Finished = "Finished",
  Playing = "Playing",
  Starting = "Starting",
}

export interface StartingGameStatus {
  type: GameStatus.Starting;
  /** Unix epoch ms when the game entered Starting status. */
  startedAt?: number;
}

export interface PlayingGameStatus {
  type: GameStatus.Playing;
  /** Present for game modes with structured turns (e.g. Werewolf). Typed per game mode. */
  turnState?: unknown;
}

/**
 * Union of all valid winner identifiers across game modes.
 * Werewolf: "Arsonist", "Village", "Werewolves", "Chupacabra", "Draw", "LoneWolf", "Tanner", "Spoiler", "Executioner", "Illuminati", "Dracula", "Zombie"
 * Secret Villain: "Good", "Bad"
 */
export type GameWinner =
  | "Arsonist"
  | "Village"
  | "Werewolves"
  | "Chupacabra"
  | "Draw"
  | "Dracula"
  | "Illuminati"
  | "LoneWolf"
  | "Mercenary"
  | "Tanner"
  | "Spoiler"
  | "Executioner"
  | "Evil"
  | "Good"
  | "Bad"
  | "Zombie";

export interface FinishedGameStatus {
  type: GameStatus.Finished;
  /** The winning team or role identifier. */
  winner?: GameWinner;
  /** Mode-specific key identifying which win condition triggered the game end. */
  victoryConditionKey?: string;
}

export type GameStatusState =
  StartingGameStatus | PlayingGameStatus | FinishedGameStatus;
