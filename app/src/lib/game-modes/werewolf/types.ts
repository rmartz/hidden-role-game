export enum WerewolfPhase {
  Nighttime = "nighttime",
  Daytime = "daytime",
}

export interface NightAction {
  targetPlayerId?: string;
  /** True when the player intentionally chose to take no action this night. */
  skipped?: true;
  confirmed?: boolean;
  /** True once the narrator has revealed the investigation result to the player. */
  resultRevealed?: boolean;
}

export interface TeamNightVote {
  playerId: string;
  targetPlayerId?: string;
  /** True when this player intentionally voted to skip (take no action). */
  skipped?: true;
}

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

export type NightResolutionEvent =
  | AttackNightResolutionEvent
  | SilencedNightResolutionEvent;

export interface WerewolfDaytimePhase {
  type: WerewolfPhase.Daytime;
  /** Unix epoch ms when the day phase began (for elapsed-time display). */
  startedAt: number;
  /** Targets from the preceding night, carried over for narrator summary. */
  nightActions: Record<string, AnyNightAction>;
  /** Resolved attack/protect outcomes, computed when transitioning to day. */
  nightResolution?: NightResolutionEvent[];
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
}

export interface TargetablePlayer {
  id: string;
  name: string;
}

export enum WakesAtNight {
  Never = "Never",
  FirstNightOnly = "FirstNightOnly",
  EveryNight = "EveryNight",
}

export enum TargetCategory {
  Attack = "Attack",
  Protect = "Protect",
  Investigate = "Investigate",
  Special = "Special",
  None = "None",
}
