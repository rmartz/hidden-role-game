/**
 * User-facing copy strings for the Werewolf game mode.
 * Interpolated strings are expressed as functions returning strings.
 */
export const WEREWOLF_COPY = {
  night: {
    yourTurn: "It's Your Turn",
    wakeUp: "Wake up and take your action.",
    stopPeeking: "Stop peeking, you dirty cheater.",
    youAreEliminated: "You Have Been Eliminated",
    eliminatedSubtext:
      "You are no longer in the game. Stay quiet while the night continues.",
    currentlyAwake: (label: string, players: string) =>
      players
        ? `Currently awake: ${label} (${players})`
        : `Currently awake: ${label}`,
    witchAbilityUsed:
      "The Witch has already used their special ability this game.",
  },
  day: {
    title: "Hidden Role Game",
    gameUnderway: "The game is underway.",
    youAreEliminated: "You have been eliminated.",
  },
  targetSelection: {
    chooseTarget: "Choose a target",
    yourTarget: "Your target",
    noAction: "You did not perform an action this turn",
    noTarget: "No target",
    noTarget_selected: "No target (selected)",
    suggestedTarget: (name: string) => `Suggested target: ${name}`,
    approveTarget: "Approve suggested target",
  },
  confirmButton: {
    actionConfirmed: "Action confirmed. Wait for the Narrator to continue.",
    makeSelection: "Make a selection first",
    groupConsensus: "All group members must agree on the same target",
    confirm: "Confirm",
    skip: "Skip",
  },
  roleDisplay: {
    yourRole: "Your Role",
    showRole: "Show role",
    roleRevealed: (roleName: string, teamLabel: string) =>
      `${roleName} (${teamLabel})`,
  },
  playerLists: {
    activePlayers: (count: number) => `Active Players (${String(count)})`,
    eliminated: (count: number) => `Eliminated (${String(count)})`,
    none: "None",
    noneYet: "None yet",
  },
  trial: {
    verdictHeading: (name: string, label: string) =>
      `Verdict: ${name} — ${label}`,
    verdictLabelEliminated: "Eliminated",
    verdictLabelInnocent: "Innocent",
    eliminatedWereRole: (name: string) => `${name} was eliminated. They were a`,
    eliminatedRoleSuffix: ".",
    youAreOnTrial: "You are on trial",
    youAreOnTrialSubtext: "You are currently on trial, try to look innocent.",
    voteHeading: (name: string) => `Vote: ${name} is on trial`,
    votesCast: (count: number, total: number) =>
      `${String(count)} of ${String(total)} votes cast`,
    yourVote: (vote: string) => ` · Your vote: ${vote}`,
    guiltyButton: "Guilty",
    innocentButton: "Innocent",
    narratorTrialHeading: (name: string) => `Trial: ${name}`,
    narratorVerdictHeading: (name: string, label: string) =>
      `Verdict: ${name} — ${label}`,
    guiltyInnocentCount: (guilty: number, innocent: number) =>
      `Guilty: ${String(guilty)} · Innocent: ${String(innocent)}`,
    guiltyInnocentTotal: (guilty: number, innocent: number, total: number) =>
      `Guilty: ${String(guilty)} · Innocent: ${String(innocent)} · Total votes: ${String(total)}`,
    resolveTrial: "Resolve Trial",
    putToVote: "Put to Vote",
    mustVoteGuiltyNote:
      "As the Village Idiot, your vote was automatically cast as Guilty.",
  },
  glossary: {
    dialogTitle: "Role Glossary",
    openButton: "Role Glossary",
    roleInfoLabel: "Role information",
  },
  narrator: {
    nightTitle: (turn: number, phase: number, total: number) =>
      `Night — Turn ${String(turn)} (${String(phase)}/${String(total)})`,
    currentlyAwake: "Currently awake:",
    startDay: "Start the Day",
    nextRole: "Next Role",
    playerUnconfirmed: "Player has not confirmed their choice",
    investigationUnrevealed:
      "Investigation result has not been revealed to the player",
    investigationResultLabel: "Investigation result:",
    teamStatus: (isWerewolfTeam: boolean) =>
      isWerewolfTeam ? "on the Werewolf team" : "not on the Werewolf team",
    investigationResultRevealed: "Result revealed to player.",
    revealToPlayer: "Reveal to player",
  },
} as const;
