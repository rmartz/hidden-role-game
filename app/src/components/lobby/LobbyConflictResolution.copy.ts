export const LOBBY_CONFLICT_RESOLUTION_COPY = {
  cardTitle: "Lobby Conflict",
  activeGame: (lobbyId: string) =>
    `You have an active game in lobby ${lobbyId}.`,
  alreadyInLobby: (lobbyId: string) => `You are already in lobby ${lobbyId}.`,
  rejoinGame: "Rejoin Game",
  stayInPreviousLobby: "Stay In Previous Lobby",
  namePlaceholder: "Your name",
  joining: "Joining...",
  leaveAndJoin: "Leave and Join This Lobby",
} as const;
