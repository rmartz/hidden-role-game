export const LOBBY_CONFIG_COPY = {
  showConfigToPlayers: "Show game configuration to all players",
  nominationEnabled:
    "Enable player nominations (a seconded nomination triggers a trial)",
  phaseTimers: "Phase Timers",
  timerManual: "Manual",
} as const;

export const TIMER_CONFIG_COPY = {
  heading: "Phase Timers",
  autoAdvance: "Automatically advance when timer expires",
  startCountdown: "Start countdown",
  nightPhase: "Night phase (per role)",
  dayDiscussion: "Day discussion",
  votingPhase: "Voting phase",
  defensePhase: "Defense speech",
} as const;
