import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain/roles";
import { AvalonRole } from "@/lib/game/modes/avalon/roles";

export const PLAYER_VISIBILITY_COPY = {
  wakePartnerHeading: "Players who wake with you",
  wakePartnerDescription:
    "These players share your night phase. You do not know their specific roles.",
  awareOfHeading: "Players you are aware of",
  awareOfDescription:
    "You know these players share your allegiance, but not their specific roles.",
  revealedHeading: "Revealed roles",
} as const;

interface VisibilityOverride {
  wakePartnerHeading?: string;
  wakePartnerDescription?: string;
  awareOfHeading?: string;
  awareOfDescription?: string;
}

/**
 * Role-specific overrides for visibility section headings and descriptions.
 * Keyed by role ID (WerewolfRole or SecretVillainRole).
 */
export const ROLE_VISIBILITY_OVERRIDES: Partial<
  Record<string, VisibilityOverride>
> = {
  [WerewolfRole.Werewolf]: {
    wakePartnerHeading: "Your pack",
    wakePartnerDescription: "These players hunt with you at night.",
  },
  [WerewolfRole.WolfCub]: {
    wakePartnerHeading: "Your pack",
    wakePartnerDescription: "These players hunt with you at night.",
  },
  [WerewolfRole.Mason]: {
    awareOfHeading: "Your fellow Masons",
    awareOfDescription:
      "You trust these players completely — they are on your side.",
  },
  [WerewolfRole.Sentinel]: {
    awareOfHeading: "The Seer",
    awareOfDescription:
      "You know who the Seer is. Protect their identity at all costs.",
  },
  [WerewolfRole.Minion]: {
    awareOfHeading: "Those whom you serve",
    awareOfDescription:
      "You know who the werewolves are, but they do not know you.",
  },
  [WerewolfRole.LoneWolf]: {
    wakePartnerHeading: "The pack",
    wakePartnerDescription:
      "These players hunt with you at night, but you walk alone.",
  },
  [WerewolfRole.Executioner]: {
    awareOfHeading: "Your target",
    awareOfDescription:
      "Convince the village to vote this player out at trial to win.",
  },
  [SecretVillainRole.Bad]: {
    awareOfHeading: "Your allies",
    awareOfDescription:
      "You know who is on the Bad team and who the Special Bad is.",
  },
  [AvalonRole.Percival]: {
    awareOfHeading: "Merlin or Morgana",
    awareOfDescription:
      "One of these players is Merlin. The other may be Morgana.",
  },
  [AvalonRole.Merlin]: {
    awareOfHeading: "The Evil team",
    awareOfDescription: "These players are Evil. Do not reveal that you know.",
  },
  [AvalonRole.MinionOfMordred]: {
    awareOfHeading: "Your allies",
    awareOfDescription: "These players are on the Evil team.",
  },
  [AvalonRole.Assassin]: {
    awareOfHeading: "Your allies",
    awareOfDescription: "These players are on the Evil team.",
  },
  [AvalonRole.Morgana]: {
    awareOfHeading: "Your allies",
    awareOfDescription: "These players are on the Evil team.",
  },
  [AvalonRole.Mordred]: {
    awareOfHeading: "Your allies",
    awareOfDescription: "These players are on the Evil team.",
  },
};

/** Roles that see the Lone Wolf warning when a Lone Wolf is in the game. */
export const LONE_WOLF_WARNING_ROLES: ReadonlySet<string> = new Set([
  WerewolfRole.Werewolf,
  WerewolfRole.WolfCub,
]);

/** Appended to the wolf pack description when a Lone Wolf could be in the game. */
export const LONE_WOLF_WARNING = " Not all may be committed to the pack.";
