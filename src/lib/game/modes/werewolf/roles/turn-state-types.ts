/**
 * Per-role persistent state types stored within WerewolfTurnState.roleState.
 *
 * These interfaces are intentionally free of imports from sibling modules to
 * avoid circular dependencies — types.ts imports from this file, and role
 * files import from types.ts.
 *
 * All types are re-exported from types.ts so callers can import them from
 * the main Werewolf types barrel.
 */

export interface AlphaWolfTurnState {
  /** True once the Alpha Wolf has used their once-per-game bite ability. */
  biteUsed: boolean;
}

export interface ArsonistTurnState {
  /** Player IDs that have been doused. Accumulated across nights; reset after an ignite. */
  dousedPlayerIds: string[];
}

export interface DraculaTurnState {
  /** Player IDs claimed as wives. Accumulated across nights. */
  wives: string[];
}

export interface EvilEmpathTurnState {
  /**
   * The last adjacency result received by the Evil Empath
   * (true = Seer is adjacent to a Werewolf). Carried forward each night so
   * the Werewolves can learn it when the Evil Empath dies.
   */
  lastResult?: boolean;
  /**
   * Set when the Evil Empath dies, revealing their last adjacency result to
   * the Werewolves. Persists for the rest of the game.
   */
  revealedResult?: boolean;
}

export interface ExecutionerTurnState {
  /** The player ID the Executioner must get eliminated at trial to win. */
  targetId: string;
}

export interface ExposerTurnState {
  /** True once the Exposer has used their once-per-game ability. */
  abilityUsed?: true;
  /** The role publicly revealed by the Exposer. */
  reveal?: { playerId: string; roleId: string };
}

export interface GhostTurnState {
  /** Ghost clues submitted during daytime. Each entry records the turn number and clue text. */
  clues: { turn: number; clue: string }[];
}

export interface HunterTurnState {
  /** Set when the Hunter dies — blocks win-condition checks until resolved. */
  revengePlayerId: string;
}

export interface IllusionArtistTurnState {
  /**
   * The player ID targeted by the Illusion Artist this night.
   * Seer investigations against this player return an inverted result for
   * the night. Not carried forward to subsequent nights.
   */
  illusionTargetId?: string;
}

export interface MercenaryTurnState {
  /** True when the Mercenary has earned a coin from a successful protection (Bribe mode active). */
  charged: boolean;
  /** Player IDs that the Mercenary has bribed. Accumulated across nights; deduplicated. */
  bribedPlayerIds: string[];
}

export interface MirrorcasterTurnState {
  /** True when charged from a successful protection (Attack mode active). */
  charged: boolean;
}

export interface MonarchTurnState {
  /** Public list of players knighted by the Monarch. */
  knightedPlayerIds: string[];
  /** Number of times the Monarch has knighted a player (max 3). */
  knightingsUsed: number;
}

export interface MorticianTurnState {
  /** True once the Mortician has successfully killed a Werewolf. */
  abilityEnded: boolean;
}

export interface OneEyedSeerTurnState {
  /** Locked onto this player ID after detecting a Werewolf. */
  lockedTargetId: string;
}

export interface PriestTurnState {
  /** Warded player IDs mapped to the Priest who placed the ward. */
  wards: Record<string, string>;
}

export interface TheThingTurnState {
  /**
   * Player ID tapped by The Thing this night.
   * Carried into the daytime phase so the tapped player can read the
   * notification before it is cleared at the start of the next night.
   */
  tapped?: string;
}

export interface ToughGuyTurnState {
  /** Player IDs that have already survived one attack. */
  hitIds: string[];
}

export interface WitchTurnState {
  /** True once the Witch has used their once-per-game ability. */
  abilityUsed: boolean;
}

export interface WolfCubTurnState {
  /** True if the Wolf Cub died this turn — Werewolves get two phases the following night. */
  died: boolean;
}

export interface ZombieTurnState {
  /** Player IDs that have been infected. Accumulated across nights. */
  infected: string[];
}

