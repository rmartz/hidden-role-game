export const LOBBY_CONFIG_COPY = {
  showConfigToPlayers: "Show game configuration to all players",
  nominationEnabled:
    "Enable player nominations (a seconded nomination triggers a trial)",
  phaseTimers: "Phase Timers",
  timerManual: "Manual",
} as const;

export const ROLE_CONFIG_COPY = {
  showAllRoles: "Show all roles",
  hideExtraRoles: "Show fewer roles",
} as const;

export const PLAYER_ROW_COPY = {
  leaveTitle: "Leave this lobby?",
  leaveDescription: "You will be removed from the lobby.",
  leaveConfirm: "Leave",
  leaveCancel: "Cancel",
  removeTitle: (name: string) => `Remove ${name} from the lobby?`,
  removeDescription: "This player will be removed from the lobby.",
  removeConfirm: "Remove",
  removeCancel: "Cancel",
  transferTitle: (name: string) => `Make ${name} the lobby owner?`,
  transferDescription:
    "You will lose owner privileges and this player will become the new lobby owner.",
  transferConfirm: "Transfer",
  transferCancel: "Cancel",
  leaveButton: "Leave",
  removeButton: "Remove",
  makeOwnerButton: "Make Owner",
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
