export const SECRET_VILLAIN_COPY = {
  board: {
    goodTrack: "Good Policies",
    badTrack: "Bad Policies",
    failedElections: "Failed Elections",
    vetoUnlocked: "Veto Power Unlocked",
  },
  election: {
    nominationHeading: "Nomination",
    nominationInstructions: (presidentName: string) =>
      `${presidentName} is selecting a Chancellor.`,
    selectChancellor: "Select Chancellor",
    confirmNomination: "Nominate",
    voteHeading: "Election",
    voteInstructions: (presidentName: string, chancellorName: string) =>
      `${presidentName} has nominated ${chancellorName} for Chancellor.`,
    castVote: "Cast your vote",
    aye: "Aye",
    no: "No",
    waitingForVotes: "Waiting for all players to vote\u2026",
    alreadyVoted: "Vote cast. Waiting for others\u2026",
    resolveVote: "Reveal Results",
    resultPassed: "Election Passed",
    resultFailed: "Election Failed",
    ayeCount: (count: number) => `${String(count)} Aye`,
    noCount: (count: number) => `${String(count)} No`,
    failedElectionWarning: (count: number, threshold: number) =>
      `${String(count)} of ${String(threshold)} failed elections. If the next election fails, a policy will be enacted automatically.`,
    chaosWarning:
      "This is the final election before a policy is enacted automatically!",
  },
  policy: {
    presidentHeading: "Policy Phase — President",
    presidentDrawInstructions: "Draw 3 policy cards from the deck.",
    presidentDraw: "Draw",
    presidentInstructions:
      "You drew 3 policy cards. Discard 1 and pass 2 to the Chancellor.",
    discard: "Discard",
    chancellorHeading: "Policy Phase — Chancellor",
    chancellorInstructions:
      "The President passed you 2 policy cards. Play 1 policy.",
    play: "Play",
    goodCard: "Good",
    badCard: "Bad",
    vetoAvailable: "Veto power is available.",
    proposeVeto: "Propose Veto",
    vetoProposed: "Veto proposed. Waiting for the President\u2026",
    vetoAccepted: "Veto accepted. Both cards discarded.",
    vetoRejected: "Veto rejected. You must play a card.",
    presidentVetoPrompt: "The Chancellor has proposed a veto.",
    acceptVeto: "Accept Veto",
    rejectVeto: "Reject Veto",
    waitingForPresident: (name: string) =>
      `Waiting for ${name} (President)\u2026`,
    waitingForChancellor: (name: string) =>
      `Waiting for ${name} (Chancellor)\u2026`,
  },
  specialAction: {
    heading: "Presidential Power",
    investigateHeading: "Investigate Loyalty",
    investigateInstructions:
      "Select a player to investigate their party membership.",
    investigateConfirm: "Investigate",
    investigateWaitingConsent: (playerName: string) =>
      `Waiting for ${playerName} to reveal\u2026`,
    investigateConsent: (presidentName: string) =>
      `${presidentName} (President) is investigating your loyalty.`,
    investigateReveal: "Reveal",
    investigateResult: (playerName: string, team: string) =>
      `${playerName} is on the ${team} team.`,
    done: "Done",
    specialElectionHeading: "Special Election",
    specialElectionInstructions: "Select a player to be the next President.",
    specialElectionConfirm: "Appoint",
    shootHeading: "Execution",
    shootInstructions: "Select a player to execute.",
    shootConfirm: "Execute",
    policyPeekHeading: "Policy Peek",
    policyPeekInstructions:
      "You may secretly look at the top 3 cards of the policy deck.",
    policyPeekReveal: "Peek",
    policyPeekCardsRevealed: "These are the top 3 cards of the policy deck.",
    policyPeekConfirm: "Done",
  },
  gameOver: {
    victory: "Victory!",
    defeat: "Game Over",
    goodWins: "Good Team Wins!",
    badWins: "Bad Team Wins!",
    rolesRevealHeading: "Role Reveals",
    returnToLobby: "Return to Lobby",
    returnToLobbyError: "Failed to return to lobby. Please try again.",
  },
  starting: {
    heading: "Game Starting",
    yourRole: (roleName: string) => `You are ${roleName}.`,
    badTeamHeading: "Your Allies",
    badTeamDescription:
      "These players are on the Bad team. One of them is the Special Bad — they raised their thumb but kept their eyes closed.",
    specialBadMarker: "(Special Bad)",
    goodTeamMessage:
      "Close your eyes and wait. The Bad team is identifying each other.",
    specialBadMessage:
      "Close your eyes and raise your thumb. The other Bad players will see you.",
    gameStartsIn: "Game begins in",
  },
  eliminated: "You have been eliminated.",
  spectating: "You are spectating.",
} as const;
