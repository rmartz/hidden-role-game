import { GameMode } from "@/lib/types";
import type { BasePlayerGameState } from "@/server/types/game";
import type { ClocktowerNomination } from "./types";

/**
 * Clocktower-specific extension of PlayerGameState. Includes all fields that
 * only exist in Clocktower games.
 *
 * Storyteller-only fields (`poisonedIndicator`, `drunkIndicator`) are reserved
 * for a future Storyteller role. They will be populated once the Clocktower
 * config introduces an owner/Storyteller player (i.e. `ownerTitle` is set).
 * Currently, no caller receives Storyteller-only state.
 */
export interface ClocktowerPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.Clocktower;
  /** Player IDs in circle seating order. Present for all players. */
  seatedOrder?: string[];
  /** Current day's nominations and their vote tallies. */
  nominations?: ClocktowerNomination[];
  /** Whether this dead player still has their ghost vote available. */
  myGhostVoteAvailable?: boolean;
  /**
   * Storyteller-provided night information for this player (e.g. "Yes" for
   * Fortune Teller, a number for Empath). Absent until the Storyteller
   * delivers it.
   */
  nightInformation?: string;
  /**
   * Storyteller-only: the player ID currently poisoned.
   * Only present in the Storyteller's (owner's) state.
   */
  poisonedIndicator?: string;
  /**
   * Storyteller-only: the player ID who is the Drunk.
   * Only present in the Storyteller's (owner's) state.
   */
  drunkIndicator?: string;
}
