export const JOIN_PROMPT_COPY = {
  cardTitle: "Join Lobby",
  errorPrefix: "Error: ",
  eyebrow: "You've been invited",
  invitedCount: (count: number) =>
    `${String(count)} ${count === 1 ? "player" : "players"} already joined`,
  joinButton: "Join lobby →",
  joining: "Joining...",
  nameLabel: "Your name",
  namePlaceholder: "Enter your name",
  redirectNote: "Joining this lobby will leave any lobby you are currently in.",
} as const;
