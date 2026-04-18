// ---------------------------------------------------------------------------
// Phase enum
// ---------------------------------------------------------------------------

export enum SecretVillainPhase {
  ElectionNomination = "election-nomination",
  ElectionVote = "election-vote",
  PolicyPresident = "policy-president",
  PolicyChancellor = "policy-chancellor",
  SpecialAction = "special-action",
}

// ---------------------------------------------------------------------------
// Policy cards
// ---------------------------------------------------------------------------

export enum PolicyCard {
  Good = "good",
  Bad = "bad",
}

/** Number of Good and Bad cards in a fresh deck. */
export const DECK_GOOD_CARDS = 6;
export const DECK_BAD_CARDS = 11;

/** Consecutive failed elections before auto-play triggers. */
export const FAILED_ELECTION_THRESHOLD = 3;

/** Number of Bad cards that must be played before the Special Bad chancellor win condition activates. */
export const BAD_CARDS_FOR_SPECIAL_BAD_WIN = 3;

/** Number of Good policy cards needed for the Good team to win via board condition. */
export const GOOD_CARDS_TO_WIN = 5;
/** Number of Bad policy cards needed for the Bad team to win via board condition. */
export const BAD_CARDS_TO_WIN = 6;

// ---------------------------------------------------------------------------
// Special action types
// ---------------------------------------------------------------------------

/** Preset board identifiers for Secret Villain power tables. */
export enum SvBoardPreset {
  Custom = "custom",
  Default = "default",
  Large = "large",
  Medium = "medium",
  Small = "small",
}

export enum SpecialActionType {
  InvestigateTeam = "investigate-team",
  PolicyPeek = "policy-peek",
  SpecialElection = "special-election",
  Shoot = "shoot",
}

/** Power table: actions triggered when the Nth Bad card is played (index 0 = 1st card). */
export type SvPowerTable = (SpecialActionType | undefined)[];

/**
 * Configurable power slot for custom boards (cards #1–#3).
 * Shoot is excluded because cards #4-#5 are always locked to Shoot.
 */
export type SvCustomPowerSlot =
  | SpecialActionType.InvestigateTeam
  | SpecialActionType.PolicyPeek
  | SpecialActionType.SpecialElection
  | undefined;

/** Custom power configuration for Bad cards #1–#3. */
export type SvCustomPowerConfig = [
  SvCustomPowerSlot,
  SvCustomPowerSlot,
  SvCustomPowerSlot,
];

/** Number of Bad cards that must be played before veto power is unlocked. */
export const VETO_UNLOCK_THRESHOLD = 4;

// ---------------------------------------------------------------------------
// Election types
// ---------------------------------------------------------------------------

export type ElectionVote = "yes" | "no";

// ---------------------------------------------------------------------------
// Phase types (discriminated union members)
// ---------------------------------------------------------------------------

/** President selects a chancellor nominee. */
export interface ElectionNominationPhase {
  type: SecretVillainPhase.ElectionNomination;
  startedAt: number;
  presidentId: string;
}

/** All players vote on the president/chancellor pairing. */
export interface ElectionVotePhase {
  type: SecretVillainPhase.ElectionVote;
  startedAt: number;
  presidentId: string;
  chancellorNomineeId: string;
  votes: { playerId: string; vote: ElectionVote }[];
  /** Set once all votes are cast. True if ayes strictly exceed nos. */
  passed?: boolean;
}

/** President draws 3 cards, discards 1, passes 2 to chancellor. */
export interface PolicyPresidentPhase {
  type: SecretVillainPhase.PolicyPresident;
  startedAt: number;
  presidentId: string;
  chancellorId: string;
  /** The 3 cards drawn from the deck. Only visible after president draws. */
  drawnCards: [PolicyCard, PolicyCard, PolicyCard];
  /** True once the president has pressed "Draw" to reveal their cards. */
  cardsRevealed?: boolean;
  /** The card discarded by the president. Set once the president decides. */
  discardedCard?: PolicyCard;
}

/** Chancellor chooses 1 of 2 cards to play. */
export interface PolicyChancellorPhase {
  type: SecretVillainPhase.PolicyChancellor;
  startedAt: number;
  presidentId: string;
  chancellorId: string;
  /** The 2 cards passed from the president. Only visible to the chancellor. */
  remainingCards: [PolicyCard, PolicyCard];
  /** The card played by the chancellor. Set once the chancellor decides. */
  playedCard?: PolicyCard;
  /** True when the chancellor has proposed a veto (awaiting president decision). */
  vetoProposed?: boolean;
  /** Set by the president: true = veto accepted, false = veto rejected. */
  vetoResponse?: boolean;
}

/** A special action triggered by a Bad card being played. */
export interface SpecialActionPhase {
  type: SecretVillainPhase.SpecialAction;
  startedAt: number;
  presidentId: string;
  actionType: SpecialActionType;
  /** The player targeted by the action (investigate, shoot, or special election). */
  targetPlayerId?: string;
  /** For InvestigateTeam: whether the target has consented to reveal. */
  targetConsented?: boolean;
  /** For InvestigateTeam: the revealed team, visible only to the president. */
  revealedTeam?: "Good" | "Bad";
  /** For PolicyPeek: the top 3 cards of the deck, visible only to the president. */
  peekedCards?: [PolicyCard, PolicyCard, PolicyCard];
  /** True once the action has been fully resolved. */
  resolved?: boolean;
}

// ---------------------------------------------------------------------------
// Turn phase union
// ---------------------------------------------------------------------------

export type SecretVillainTurnPhase =
  | ElectionNominationPhase
  | ElectionVotePhase
  | PolicyPresidentPhase
  | PolicyChancellorPhase
  | SpecialActionPhase;

// ---------------------------------------------------------------------------
// Turn state
// ---------------------------------------------------------------------------

export interface SecretVillainTurnState {
  /** Current turn number (increments each time a new president takes the chair). */
  turn: number;
  /** Current game phase. */
  phase: SecretVillainTurnPhase;
  /** Fixed player rotation order for the presidency (player IDs). */
  presidentOrder: string[];
  /** Index into presidentOrder for the current (or next) president. */
  currentPresidentIndex: number;
  /** Number of Good policy cards played on the board (0–5). */
  goodCardsPlayed: number;
  /** Number of Bad policy cards played on the board (0–6). */
  badCardsPlayed: number;
  /** The draw pile (face-down). Reshuffled from discards when exhausted. */
  deck: PolicyCard[];
  /** Cards that have been discarded (by president or chancellor). */
  discardPile: PolicyCard[];
  /** Player IDs removed from the game by the Shoot power. */
  eliminatedPlayerIds: string[];
  /** Player ID of the previous turn's president (ineligible for chancellor). */
  previousPresidentId?: string;
  /** Player ID of the previous turn's chancellor (ineligible for chancellor). */
  previousChancellorId?: string;
  /** Number of consecutive failed elections (resets on a successful election). */
  failedElectionCount: number;
  /**
   * One-time president override: if set, this player becomes president for the
   * next turn, after which the normal rotation resumes.
   */
  specialPresidentId?: string;
  /** Which board preset determines special action powers. */
  boardPreset: SvBoardPreset;
  /** Resolved power table for this game (5 entries, one per Bad card slot). */
  powerTable: SvPowerTable;
}
