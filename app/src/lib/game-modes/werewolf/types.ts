export enum WerewolfPhase {
  Nighttime = "nighttime",
  Daytime = "daytime",
}

export interface NightAction {
  targetPlayerId: string;
  confirmed?: boolean;
}

export interface TeamNightVote {
  playerId: string;
  targetPlayerId: string;
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
  /** Role IDs (or team phase keys like "team:Bad") in wake order. */
  nightPhaseOrder: string[];
  /** Index into nightPhaseOrder for the currently active phase. */
  currentPhaseIndex: number;
  /** Targets chosen during this night. Key is roleId or team phase key. */
  nightActions: Record<string, AnyNightAction>;
}

export interface WerewolfDaytimePhase {
  type: WerewolfPhase.Daytime;
  /** Unix epoch ms when the day phase began (for elapsed-time display). */
  startedAt: number;
  /** Targets from the preceding night, carried over for narrator summary. */
  nightActions: Record<string, AnyNightAction>;
}

export type WerewolfTurnPhase = WerewolfNighttimePhase | WerewolfDaytimePhase;

export interface WerewolfTurnState {
  turn: number;
  phase: WerewolfTurnPhase;
  /** Player IDs that have been marked as dead by the narrator. */
  deadPlayerIds: string[];
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
