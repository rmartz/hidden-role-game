export const JOIN_PROMPT_COPY = {
  cardTitle: "Join the lobby",
  errorPrefix: "Error: ",
  eyebrow: "You've been invited",
  invitedCount: (count: number) =>
    `${String(count)} ${count === 1 ? "player" : "players"} already inside · waiting on the owner.`,
  joinButton: "Join lobby →",
  joining: "Joining...",
  nameLabel: "Your name",
  namePlaceholder: "Pick a name your table knows",
  redirectNote: "Names must be unique within a lobby.",
} as const;
