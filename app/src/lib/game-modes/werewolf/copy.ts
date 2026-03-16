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
    revealRole: "Reveal Role",
    hidesAutomatically: "Hides automatically. Tap to hide now.",
    hide: "Hide",
  },
  playerLists: {
    activePlayers: (count: number) => `Active Players (${String(count)})`,
    eliminated: (count: number) => `Eliminated (${String(count)})`,
    none: "None",
    noneYet: "None yet",
  },
} as const;
