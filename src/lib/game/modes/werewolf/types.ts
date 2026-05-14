import type {
  ArsonistTurnState,
  DraculaTurnState,
  ExecutionerTurnState,
  ExposerTurnState,
  HunterTurnState,
  MirrorcasterTurnState,
  MonarchTurnState,
  MorticianTurnState,
  OneEyedSeerTurnState,
  PriestTurnState,
  ToughGuyTurnState,
  WitchTurnState,
  WolfCubTurnState,
  ZombieTurnState,
} from "./roles/turn-state-types";

export type {
  ArsonistTurnState,
  DraculaTurnState,
  ExecutionerTurnState,
  ExposerTurnState,
  HunterTurnState,
  MirrorcasterTurnState,
  MonarchTurnState,
  MorticianTurnState,
  OneEyedSeerTurnState,
  PriestTurnState,
  ToughGuyTurnState,
  WitchTurnState,
  WolfCubTurnState,
  ZombieTurnState,
};

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
  /** Unix epoch ms when the narrator paused the active timer. Absent when running. */
  pausedAt?: number;
  /** Accumulated running milliseconds from prior run periods (before the most recent pause). */
  pauseOffset?: number;
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

export enum DaytimeVote {
  Guilty = "guilty",
  Innocent = "innocent",
}

export enum TrialPhase {
  Defense = "defense",
  Voting = "voting",
}

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
  /** Unix epoch ms when the narrator paused the active trial timer. Absent when running. */
  pausedAt?: number;
  /** Accumulated elapsed milliseconds from prior running segments, carried into this one on resume. */
  pauseOffset?: number;
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
  /** Unix epoch ms when the narrator paused the active timer. Absent when running. */
  pausedAt?: number;
  /** Accumulated running milliseconds from prior run periods (before the most recent pause). */
  pauseOffset?: number;
  /** Targets from the preceding night, carried over for narrator summary. */
  nightActions: Record<string, AnyNightAction>;
  /** Resolved attack/protect outcomes, computed when transitioning to day. */
  nightResolution?: NightResolutionEvent[];
  /** Player ID newly knighted by the Monarch during the preceding night, if any. */
  knightedPlayerId?: string;
  /**
   * Player IDs whose night outcomes have been publicly revealed by the narrator.
   * Absent (or empty) when none have been revealed yet; populated via
   * RevealNightOutcomeStep action (one player per press). When
   * autoRevealNightOutcome is enabled, this is pre-populated with all affected
   * player IDs at day-start so visibility logic can treat them as revealed.
   */
  revealedPlayerIds?: string[];
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

/**
 * Namespaced per-role persistent state stored within WerewolfTurnState.
 * Adding a new role adds one optional key here; no other turn-state field changes.
 * Each role's state type is defined in roles/turn-state-types.ts.
 */
export interface WerewolfRoleTurnState {
  arsonist?: ArsonistTurnState;
  dracula?: DraculaTurnState;
  executioner?: ExecutionerTurnState;
  exposer?: ExposerTurnState;
  hunter?: HunterTurnState;
  mirrorcaster?: MirrorcasterTurnState;
  monarch?: MonarchTurnState;
  mortician?: MorticianTurnState;
  oneEyedSeer?: OneEyedSeerTurnState;
  priest?: PriestTurnState;
  toughGuy?: ToughGuyTurnState;
  witch?: WitchTurnState;
  wolfCub?: WolfCubTurnState;
  zombie?: ZombieTurnState;
}

export interface WerewolfTurnState {
  turn: number;
  phase: WerewolfTurnPhase;
  /** Player IDs that have been marked as dead by the narrator. */
  deadPlayerIds: string[];
  /**
   * Maps phase key → player ID that was targeted last night.
   * Used to prevent roles with preventRepeatTarget from targeting the same
   * player on consecutive nights.
   */
  lastTargets?: Record<string, string>;
  /** Namespaced per-role persistent state. One optional key per role. */
  roleState?: WerewolfRoleTurnState;
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
