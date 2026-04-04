import type { TimerConfig } from "@/lib/types";

/** Secret Villain–specific timer configuration. */
export interface SecretVillainTimerConfig extends TimerConfig {
  /** Seconds for the election vote phase before abstentions are allowed. */
  electionVoteSeconds: number;
}

export const DEFAULT_SECRET_VILLAIN_TIMER_CONFIG: SecretVillainTimerConfig = {
  autoAdvance: false,
  startCountdownSeconds: 15,
  electionVoteSeconds: 60,
};
