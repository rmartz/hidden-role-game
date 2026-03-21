export const PLAYER_VISIBILITY_COPY = {
  wakePartnerHeading: "Players who wake with you",
  wakePartnerDescription:
    "These players share your night phase. You do not know their specific roles.",
  awareOfHeading: "Players you are aware of",
  awareOfDescription:
    "You know these players share your allegiance, but not their specific roles.",
  revealedHeading: "Revealed roles",
} as const;

/**
 * Role-specific overrides for visibility section headings and descriptions.
 * Keyed by WerewolfRole enum value.
 */
export const ROLE_VISIBILITY_OVERRIDES: Record<
  string,
  Partial<{
    wakePartnerHeading: string;
    wakePartnerDescription: string;
    awareOfHeading: string;
    awareOfDescription: string;
  }>
> = {
  "werewolf-werewolf": {
    wakePartnerHeading: "Your pack",
    wakePartnerDescription: "These players hunt with you at night.",
  },
  "werewolf-wolf-cub": {
    wakePartnerHeading: "Your pack",
    wakePartnerDescription: "These players hunt with you at night.",
  },
  "werewolf-mason": {
    awareOfHeading: "Your fellow Masons",
    awareOfDescription:
      "You trust these players completely — they are on your side.",
  },
  "werewolf-minion": {
    awareOfHeading: "Those whom you serve",
    awareOfDescription:
      "You know who the werewolves are, but they do not know you.",
  },
  "werewolf-lone-wolf": {
    wakePartnerHeading: "The pack",
    wakePartnerDescription:
      "These players hunt with you at night, but you walk alone.",
  },
  "werewolf-executioner": {
    awareOfHeading: "Your target",
    awareOfDescription:
      "Convince the village to vote this player out at trial to win.",
  },
};

/** Appended to the wolf pack description when a Lone Wolf could be in the game. */
export const LONE_WOLF_WARNING = " Not all may be committed to the pack.";
