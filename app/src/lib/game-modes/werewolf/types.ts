export enum WerewolfPhase {
  Nighttime = "nighttime",
  Daytime = "daytime",
}

export interface WerewolfNighttimePhase {
  type: WerewolfPhase.Nighttime;
  /** Role IDs in the order they wake, determined at phase start. */
  nightPhaseOrder: string[];
  /** Index into nightPhaseOrder for the currently active role. */
  currentPhaseIndex: number;
}

export interface WerewolfDaytimePhase {
  type: WerewolfPhase.Daytime;
  /** Unix epoch ms when the day phase began (for elapsed-time display). */
  startedAt: number;
}

export type WerewolfTurnPhase = WerewolfNighttimePhase | WerewolfDaytimePhase;

export interface WerewolfTurnState {
  turn: number;
  phase: WerewolfTurnPhase;
}

export enum WakesAtNight {
  Never = "Never",
  FirstNightOnly = "FirstNightOnly",
  EveryNight = "EveryNight",
}
