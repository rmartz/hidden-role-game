import type { TimerRow } from "./TimerConfigPanelRow";
import { TIMER_CONFIG_COPY } from "./TimerConfigPanel.copy";
import { SECRET_VILLAIN_CONFIG_PANEL_COPY } from "./SecretVillainConfigPanel.copy";

export const WEREWOLF_TIMER_ROWS: TimerRow[] = [
  {
    label: TIMER_CONFIG_COPY.startCountdown,
    field: "startCountdownSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
  {
    label: TIMER_CONFIG_COPY.nightPhase,
    field: "nightPhaseSeconds",
    min: 10,
    max: 120,
    step: 5,
  },
  {
    label: TIMER_CONFIG_COPY.dayDiscussion,
    field: "dayPhaseSeconds",
    min: 30,
    max: 900,
    step: 30,
  },
  {
    label: TIMER_CONFIG_COPY.votingPhase,
    field: "votePhaseSeconds",
    min: 15,
    max: 300,
    step: 15,
  },
  {
    label: TIMER_CONFIG_COPY.defensePhase,
    field: "defensePhaseSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
];

export const SECRET_VILLAIN_TIMER_ROWS: TimerRow[] = [
  {
    label: TIMER_CONFIG_COPY.startCountdown,
    field: "startCountdownSeconds",
    min: 5,
    max: 60,
    step: 5,
  },
  {
    label: SECRET_VILLAIN_CONFIG_PANEL_COPY.electionVote,
    field: "electionVoteSeconds",
    min: 15,
    max: 300,
    step: 15,
  },
];
