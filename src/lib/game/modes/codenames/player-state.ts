import { GameMode } from "@/lib/types";
import type { BasePlayerGameState } from "@/server/types/game";
import type {
  BoardCard,
  Clue,
  CodenamesTurnPhase,
  CodenamesTeam,
} from "./types";

export interface CodenamesPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.Codenames;
  /** The 25-card board. Guessers only see words and revealed state for unrevealed cards. */
  board?: BoardCard[];
  /** The current turn phase (GiveClue or Guess). */
  codenamesPhase?: CodenamesTurnPhase;
  /** History of all clues given so far — visible to all players. */
  clueHistory?: Clue[];
  /** Current turn number. */
  codenamesTurn?: number;
  /** The team whose turn it currently is. */
  activeTeam?: CodenamesTeam;
  /** The team that goes first and has 9 words (the other has 8). */
  startingTeam?: CodenamesTeam;
}
