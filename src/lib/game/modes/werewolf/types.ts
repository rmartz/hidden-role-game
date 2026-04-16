export enum WerewolfPhase {
  Nighttime = "nighttime",
  Daytime = "daytime",
}

export type NightAction = {
  confirmed?: boolean;
  /** True once the narrator has revealed the investigation result to the player. */
  resultRevealed?: boolean;
  /** For Mentalist only: the second target player ID. */
  secondTargetPlayerId?: string;
} & (
  | { targetPlayerId: string; skipped?: never }
  | { skipped: true; targetPlayerId?: never }
  | { targetPlayerId?: never; skipped?: never }
);

export type TeamNightVote =
  | { playerId: string; targetPlayerId: string; skipped?: never }
  | { playerId: string; skipped: true; targetPlayerId?: never };

export interface TeamNightAction {
  votes: TeamNightVote[];
  suggestedTargetId?: string;
  confirmed?: boolean;
}

export type AnyNightAction = NightAction | TeamNightAction;

export function isTeamNightAction(
  action: AnyNightAction,
): action is TeamNightAction {
  return "votes" in action;
}

export interface WerewolfNighttimePhase {
  type: WerewolfPhase.Nighttime;
  /** Unix epoch ms when this night role phase began (reset per role). */
  startedAt: number;
  /** Role IDs in wake order. Group phases use the primary role's ID. */
  nightPhaseOrder: string[];
  /** Index into nightPhaseOrder for the currently active phase. */
  currentPhaseIndex: number;
  /** Targets chosen during this night. Key is roleId. */
  nightActions: Record<string, AnyNightAction>;
  /** Player IDs smited by the narrator this night. */
  smitedPlayerIds?: string[];
}

export interface AttackNightResolutionEvent {
  type: "killed";
  targetPlayerId: string;
  /** Phase keys (role IDs or team phase keys) that attacked this player. */
  attackedBy: string[];
  /** Phase keys (role IDs) that protected this player. */
  protectedBy: string[];
  /** True if the player was attacked and not protected — they die. */
  died: boolean;
}

export interface SilencedNightResolutionEvent {
  type: "silenced";
  targetPlayerId: string;
}

export interface HypnotizedNightResolutionEvent {
  type: "hypnotized";
  targetPlayerId: string;
  /** The player ID of the Mummy who cast the hypnosis. Used to lift the effect if the Mummy dies. */
  mummyPlayerId: string;
}

export interface ToughGuyAbsorbedNightResolutionEvent {
  type: "tough-guy-absorbed";
  targetPlayerId: string;
}

export interface AltruistInterceptedNightResolutionEvent {
  type: "altruist-intercepted";
  /** The Altruist player who sacrificed themselves. */
  altruistPlayerId: string;
  /** The player whose attack was redirected to the Altruist. */
  savedPlayerId: string;
}

export type NightResolutionEvent =
  | AttackNightResolutionEvent
  | SilencedNightResolutionEvent
  | HypnotizedNightResolutionEvent
  | ToughGuyAbsorbedNightResolutionEvent
  | AltruistInterceptedNightResolutionEvent;

export type DaytimeVote = "guilty" | "innocent";

export type TrialPhase = "defense" | "voting";

export enum TrialVerdict {
  Eliminated = "eliminated",
  Innocent = "innocent",
}

export interface ActiveTrial {
  defendantId: string;
  /** Unix epoch ms when the trial started. */
  startedAt: number;
  /** Current phase of the trial: defense speech or voting. */
  phase: TrialPhase;
  /** Unix epoch ms when the voting phase began. Set when transitioning from defense to voting. */
  voteStartedAt?: number;
  votes: { playerId: string; vote: DaytimeVote }[];
  verdict?: TrialVerdict;
}

export interface Nomination {
  nominatorId: string;
  defendantId: string;
}

export interface WerewolfDaytimePhase {
  type: WerewolfPhase.Daytime;
  /** Unix epoch ms when the day phase began (for elapsed-time display). */
  startedAt: number;
  /** Targets from the preceding night, carried over for narrator summary. */
  nightActions: Record<string, AnyNightAction>;
  /** Resolved attack/protect outcomes, computed when transitioning to day. */
  nightResolution?: NightResolutionEvent[];
  /** Player IDs smited by the narrator during the preceding night. */
  smitedPlayerIds?: string[];
  /** Player IDs marked by the narrator for elimination after the next night. */
  pendingSmitePlayerIds?: string[];
  /** Active elimination trial, if one has been called by the narrator. */
  activeTrial?: ActiveTrial;
  /** Player nominations for trial. Each player holds at most one nomination. */
  nominations?: Nomination[];
  /** Number of trials that have concluded (with a verdict) this day phase. */
  concludedTrialsCount?: number;
}

export type WerewolfTurnPhase = WerewolfNighttimePhase | WerewolfDaytimePhase;

export interface WerewolfTurnState {
  turn: number;
  phase: WerewolfTurnPhase;
  /** Player IDs that have been marked as dead by the narrator. */
  deadPlayerIds: string[];
  /** True once the Witch has used her once-per-game special ability. */
  witchAbilityUsed?: boolean;
  /**
   * Maps phase key → player ID that was targeted last night.
   * Used to prevent roles with preventRepeatTarget from targeting the same
   * player on consecutive nights.
   */
  lastTargets?: Record<string, string>;
  /** True if a Wolf Cub died this turn — Werewolves get two phases the following night. */
  wolfCubDied?: boolean;
  /** Maps warded player ID → Priest player ID. Ward persists until the warded player is attacked. */
  priestWards?: Record<string, string>;
  /** Player IDs of Tough Guys who have already survived one attack. */
  toughGuyHitIds?: string[];
  /**
   * One-Eyed Seer is locked onto this player ID after detecting a Werewolf.
   * Cleared when the locked target is eliminated.
   */
  oneEyedSeerLockedTargetId?: string;
  /** Set when the Hunter dies — blocks win-condition checks and game advancement until resolved. */
  hunterRevengePlayerId?: string;
  /** True once the Exposer has used their once-per-game ability. */
  exposerAbilityUsed?: boolean;
  /** The role publicly revealed by the Exposer. Persists for the rest of the game. */
  exposerReveal?: { playerId: string; roleId: string };
  /** True once the Mortician has successfully killed a Werewolf. */
  morticianAbilityEnded?: boolean;
  /** The player ID that the Executioner must get eliminated at trial to win. */
  executionerTargetId?: string;
  /** True when the Mirrorcaster has gained a charge from a successful protection. */
  mirrorcasterCharged?: boolean;
}

export interface TargetablePlayer {
  id: string;
  name: string;
}

export enum WakesAtNight {
  Never = "Never",
  FirstNightOnly = "FirstNightOnly",
  AfterFirstNight = "AfterFirstNight",
  EveryNight = "EveryNight",
}

export enum TargetCategory {
  Attack = "Attack",
  Protect = "Protect",
  Investigate = "Investigate",
  Special = "Special",
  None = "None",
}
