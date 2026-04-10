// ---------------------------------------------------------------------------
// Phase enum
// ---------------------------------------------------------------------------

export enum ClockworkPhase {
  Night = "night",
  Day = "day",
}

// ---------------------------------------------------------------------------
// Night action types
// ---------------------------------------------------------------------------

/**
 * Records the action taken by a role during the night.
 *
 * Most Clocktower night actions involve choosing a single target; the
 * Storyteller then mediates information delivery manually.
 * Role-specific extensions (e.g. Fortune Teller's second target) should
 * extend this interface per role as needed.
 *
 * Keyed by role ID in `ClockworkNightPhase.nightActions` — assumes one active
 * instance per role ID per night.
 */
export interface ClockworkNightAction {
  /** The primary player ID targeted by this role's night action. */
  targetPlayerId?: string;
}

// ---------------------------------------------------------------------------
// Nomination types
// ---------------------------------------------------------------------------

export interface ClockworkNominationVote {
  /** The voting player's ID. */
  playerId: string;
  /** True if the player voted to execute the nominee. */
  voted: boolean;
}

/** A single nomination made during a day phase, with its running vote tally. */
export interface ClockworkNomination {
  /** The player who called the nomination. */
  nominatorId: string;
  /** The player nominated for execution. */
  nomineeId: string;
  /** Votes cast for this nomination in player order. */
  votes: ClockworkNominationVote[];
}

// ---------------------------------------------------------------------------
// Phase types (discriminated union members)
// ---------------------------------------------------------------------------

/**
 * Night phase — Storyteller mediates night actions in order.
 *
 * Trouble Brewing night action order:
 *   1. Poisoner (choose target)
 *   2. Monk (choose target to protect)
 *   3. Imp (choose kill target)
 *   4. Deaths resolved
 *   5. Information roles wake: Washerwoman, Librarian, Investigator,
 *      Chef (first night only), Empath, Fortune Teller, Undertaker,
 *      Ravenkeeper (on death only)
 */
export interface ClockworkNightPhase {
  type: ClockworkPhase.Night;
  /** Index into the night action order for the currently active step. */
  currentActionIndex: number;
  /**
   * Night actions submitted this night. Key is the role ID of the acting role.
   * Assumes one active instance per role ID per night.
   */
  nightActions: Record<string, ClockworkNightAction>;
}

/** Day phase — open discussion, nominations, and voting. */
export interface ClockworkDayPhase {
  type: ClockworkPhase.Day;
  /** All nominations made today, in the order they were called. */
  nominations: ClockworkNomination[];
  /**
   * Player IDs who have already nominated today.
   * Each player may only nominate once per day.
   */
  nominatedByPlayerIds: string[];
  /**
   * Player ID executed today, if any.
   * Prevents further executions this day phase.
   */
  executedToday?: string;
}

// ---------------------------------------------------------------------------
// Turn phase union
// ---------------------------------------------------------------------------

export type ClockworkTurnPhase = ClockworkNightPhase | ClockworkDayPhase;

// ---------------------------------------------------------------------------
// Turn state
// ---------------------------------------------------------------------------

export interface ClockworkTurnState {
  /** Current day/night number (increments each night). */
  turn: number;
  /** Current game phase. */
  phase: ClockworkTurnPhase;
  /**
   * Seated player order. Determines neighbor relationships used by
   * neighbor-based abilities (e.g. Empath, Chef).
   */
  playerOrder: string[];
  /** Player IDs who have died. */
  deadPlayerIds: string[];
  /** Player IDs who have already spent their single ghost vote. */
  ghostVotesUsed: string[];
  /**
   * Player ID currently poisoned by the Poisoner.
   * A poisoned player's ability malfunctions for the night they are poisoned
   * and the following day; the Storyteller may give them false information.
   */
  poisonedPlayerId?: string;
  /**
   * Player ID of the Drunk. Persistent and hidden from that player —
   * they believe they are a Townsfolk, but their ability never works.
   */
  drunkPlayerId?: string;
  /**
   * Current Demon player ID.
   * Can change via Imp self-kill (Minion succession) or Scarlet Woman
   * trigger (when the Demon dies with 5+ players alive).
   */
  demonPlayerId: string;
}
