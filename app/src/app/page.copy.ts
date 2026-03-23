export const HOME_PAGE_COPY = {
  title: "Hidden Role Game",
  subtitle:
    "Host and play social deduction games with friends — no cards needed.",
  activeGame: "You have an active game in progress.",
  rejoinGame: "Rejoin Game",
  activeLobby: (lobbyId: string) => `You are already in lobby: ${lobbyId}`,
  rejoinLobby: "Rejoin Lobby",
  errorPrefix: "Error: ",
  playerNameLabel: "Your name",
  playerNamePlaceholder: "Enter your name",
  lobbyIdLabel: "Lobby ID",
  lobbyIdPlaceholder: "Leave blank to create a new lobby",
  gameModeLabel: "Game",
  creating: "Creating\u2026",
  createLobby: "Create Lobby",
  joining: "Joining\u2026",
  joinLobby: "Join Lobby",
} as const;
