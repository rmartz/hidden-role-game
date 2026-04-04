import type { TimerConfig } from "@/lib/types";

/** Werewolf-specific timer configuration. */
export interface WerewolfTimerConfig extends TimerConfig {
  /** Seconds per night role phase. */
  nightPhaseSeconds: number;
  /** Seconds for day discussion. */
  dayPhaseSeconds: number;
  /** Seconds for a daytime elimination vote. */
  votePhaseSeconds: number;
  /** Seconds for the defense speech before an elimination vote. */
  defensePhaseSeconds: number;
}

export const DEFAULT_WEREWOLF_TIMER_CONFIG: WerewolfTimerConfig = {
  autoAdvance: false,
  startCountdownSeconds: 10,
  nightPhaseSeconds: 30,
  dayPhaseSeconds: 300,
  votePhaseSeconds: 20,
  defensePhaseSeconds: 10,
};
