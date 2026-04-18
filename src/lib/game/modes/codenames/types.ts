// ---------------------------------------------------------------------------
// Team and card color types
// ---------------------------------------------------------------------------

export enum CodenamesTeam {
  Red = "red",
  Blue = "blue",
}

export enum BoardCardColor {
  Red = "red",
  Blue = "blue",
  Neutral = "neutral",
  Assassin = "assassin",
}

// ---------------------------------------------------------------------------
// Board card
// ---------------------------------------------------------------------------

export interface BoardCard {
  /** The word displayed on this card. */
  word: string;
  /** The card's true color — hidden from Guessers until revealed. */
  color: BoardCardColor;
  /** Whether this card has been flipped by a team. */
  revealed: boolean;
  /** Which team flipped this card, if any. */
  revealedBy?: CodenamesTeam;
}

// ---------------------------------------------------------------------------
// Clue
// ---------------------------------------------------------------------------

export interface Clue {
  /** The one-word clue given by the Codemaster. */
  word: string;
  /** The number of board words that relate to this clue. */
  number: number;
  /** The team whose Codemaster gave this clue. */
  team: CodenamesTeam;
  /** The turn number on which this clue was given. */
  turn: number;
}

// ---------------------------------------------------------------------------
// Phase enum and phase types (discriminated union)
// ---------------------------------------------------------------------------

export enum CodenamesPhase {
  GiveClue = "give-clue",
  Guess = "guess",
}

/** The active team's Codemaster enters a one-word clue and number. */
export interface GiveCluePhase {
  type: CodenamesPhase.GiveClue;
}

/** The active team's Guessers tap words on the board. */
export interface GuessPhase {
  type: CodenamesPhase.Guess;
  /** The clue that prompted this guessing phase. */
  clue: Clue;
}

export type CodenamesTurnPhase = GiveCluePhase | GuessPhase;

// ---------------------------------------------------------------------------
// Turn state
// ---------------------------------------------------------------------------

export interface CodenamesTurnState {
  /** Current turn number. */
  turn: number;
  /** Current game phase. */
  phase: CodenamesTurnPhase;
  /** The team whose turn it currently is. */
  activeTeam: CodenamesTeam;
  /** The 25-card game board. */
  board: [
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
    BoardCard,
  ];
  /** History of all clues given, in order. */
  clueHistory: Clue[];
  /** How many guesses the active team has remaining this turn. */
  guessesRemaining: number;
  /** The team that goes first and has 9 words assigned (the other has 8). */
  startingTeam: CodenamesTeam;
}
