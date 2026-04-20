// ---------------------------------------------------------------------------
// Phase enum
// ---------------------------------------------------------------------------

export enum ClocktowerPhase {
  Night = "night",
  Day = "day",
}

// ---------------------------------------------------------------------------
// Night action types
// ---------------------------------------------------------------------------

/**
 * Storyteller-provided information for a night action.
 *
 * Shape varies by role:
 * - Empath, Chef: `number` (0–2 for Empath; ≥0 count for Chef)
 * - Fortune Teller: `boolean` (yes = Demon present)
 * - Washerwoman, Librarian, Investigator: two player IDs + a role name
 * - Undertaker, Ravenkeeper: a role name
 */
export type ClocktowerNightInformation =
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "two-players-role"; playerIds: [string, string]; roleId: string }
  | { type: "role"; roleId: string };

/**
 * Records the action taken by a role during the night.
 *
 * Most Clocktower night actions involve choosing a single target; the
 * Storyteller then mediates information delivery manually.
 *
 * Keyed by role ID in `ClocktowerNightPhase.nightActions` — assumes one active
 * instance per role ID per night.
 */
export interface ClocktowerNightAction {
  /** The primary player ID targeted by this role's night action. */
  targetPlayerId?: string;
  /** Fortune Teller only: second player targeted. */
  secondTargetPlayerId?: string;
  /** Whether the player has confirmed their target selection. */
  confirmed?: true;
  /**
   * Storyteller-entered information for this role.
   * Set via the `provide-information` action after the player wakes.
   */
  information?: ClocktowerNightInformation;
}

// ---------------------------------------------------------------------------
// Nomination types
// ---------------------------------------------------------------------------

export interface ClocktowerNominationVote {
  /** The voting player's ID. */
  playerId: string;
  /** True if the player voted to execute the nominee. */
  voted: boolean;
}

/** A single nomination made during a day phase, with its running vote tally. */
export interface ClocktowerNomination {
  /** The player who called the nomination. */
  nominatorId: string;
  /** The player nominated for execution. */
  nomineeId: string;
  /** Votes cast for this nomination in player order. */
  votes: ClocktowerNominationVote[];
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
export interface ClocktowerNightPhase {
  type: ClocktowerPhase.Night;
  /** Index into the night action order for the currently active step. */
  currentActionIndex: number;
  /**
   * Night actions submitted this night. Key is the role ID of the acting role.
   * Assumes one active instance per role ID per night.
   */
  nightActions: Record<string, ClocktowerNightAction>;
}

/** Day phase — open discussion, nominations, and voting. */
export interface ClocktowerDayPhase {
  type: ClocktowerPhase.Day;
  /** All nominations made today, in the order they were called. */
  nominations: ClocktowerNomination[];
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

export type ClocktowerTurnPhase = ClocktowerNightPhase | ClocktowerDayPhase;

// ---------------------------------------------------------------------------
// Turn state
// ---------------------------------------------------------------------------

export interface ClocktowerTurnState {
  /** Current day/night number (increments each night). */
  turn: number;
  /** Current game phase. */
  phase: ClocktowerTurnPhase;
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
