import { Team } from "@/lib/types";
import type { RoleBucket, RoleDefinition } from "@/lib/types";

// ---------------------------------------------------------------------------
// Character type enum
// ---------------------------------------------------------------------------

/**
 * Clocktower character types — sub-classifications within Team.
 * Good: Townsfolk | Outsider
 * Bad: Minion | Demon
 */
export enum ClocktowerCharacterType {
  Demon = "demon",
  Minion = "minion",
  Outsider = "outsider",
  Townsfolk = "townsfolk",
}

export const CLOCKTOWER_CHARACTER_TYPE_ORDER: ClocktowerCharacterType[] = [
  ClocktowerCharacterType.Townsfolk,
  ClocktowerCharacterType.Outsider,
  ClocktowerCharacterType.Minion,
  ClocktowerCharacterType.Demon,
];

export const CLOCKTOWER_CHARACTER_TYPE_LABELS: Record<
  ClocktowerCharacterType,
  string
> = {
  [ClocktowerCharacterType.Demon]: "Demon",
  [ClocktowerCharacterType.Minion]: "Minion",
  [ClocktowerCharacterType.Outsider]: "Outsider",
  [ClocktowerCharacterType.Townsfolk]: "Townsfolk",
};

// ---------------------------------------------------------------------------
// Role enum (alphabetical)
// ---------------------------------------------------------------------------

export enum ClocktowerRole {
  Baron = "clocktower-baron",
  Butler = "clocktower-butler",
  Chef = "clocktower-chef",
  Drunk = "clocktower-drunk",
  Empath = "clocktower-empath",
  FortuneTeller = "clocktower-fortune-teller",
  Imp = "clocktower-imp",
  Investigator = "clocktower-investigator",
  Librarian = "clocktower-librarian",
  Mayor = "clocktower-mayor",
  Monk = "clocktower-monk",
  Poisoner = "clocktower-poisoner",
  Ravenkeeper = "clocktower-ravenkeeper",
  Recluse = "clocktower-recluse",
  Saint = "clocktower-saint",
  ScarletWoman = "clocktower-scarlet-woman",
  Slayer = "clocktower-slayer",
  Soldier = "clocktower-soldier",
  Spy = "clocktower-spy",
  Undertaker = "clocktower-undertaker",
  Virgin = "clocktower-virgin",
  Washerwoman = "clocktower-washerwoman",
}

// ---------------------------------------------------------------------------
// Role definition interface
// ---------------------------------------------------------------------------

export interface ClocktowerRoleDefinition extends RoleDefinition<
  ClocktowerRole,
  Team
> {
  /** Clocktower sub-classification within Team. */
  characterType: ClocktowerCharacterType;
  /**
   * When true, this role is assigned to one player but that player sees a
   * random Townsfolk token instead. Their actual ability never works.
   * (Used exclusively by the Drunk.)
   */
  showsFakeTownsfolkToken?: true;
  /**
   * When true, this role may register as a different character type or team
   * than it actually is to other abilities (e.g. Recluse may register as evil).
   */
  registrationOverride?: true;
}

// ---------------------------------------------------------------------------
// Player count → role distribution
// ---------------------------------------------------------------------------

interface RoleDistribution {
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
}

const ROLE_DISTRIBUTIONS: Record<number, RoleDistribution> = {
  5: { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
  6: { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
  7: { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
  8: { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
  9: { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
  10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
  11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
  12: { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
  13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
  14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
  15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 },
};

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 15;

const FALLBACK_DISTRIBUTION: RoleDistribution = {
  townsfolk: 9,
  outsiders: 2,
  minions: 3,
  demons: 1,
};

/**
 * Returns default role buckets for Clocktower's Trouble Brewing script.
 * All players receive a role — there is no narrator slot.
 *
 * Note: The Baron modifies this — when the Baron is in play, 2 extra Outsiders
 * replace 2 Townsfolk slots. This adjustment is made during game initialization,
 * not in the default bucket configuration.
 */
export function defaultRoleCount(numPlayers: number): RoleBucket[] {
  const n = Math.min(Math.max(numPlayers, MIN_PLAYERS), MAX_PLAYERS);
  const dist = ROLE_DISTRIBUTIONS[n] ?? FALLBACK_DISTRIBUTION;

  return [
    {
      playerCount: dist.townsfolk,
      roles: [
        { roleId: ClocktowerRole.Washerwoman },
        { roleId: ClocktowerRole.Librarian },
        { roleId: ClocktowerRole.Investigator },
        { roleId: ClocktowerRole.Chef },
        { roleId: ClocktowerRole.Empath },
        { roleId: ClocktowerRole.FortuneTeller },
        { roleId: ClocktowerRole.Undertaker },
        { roleId: ClocktowerRole.Monk },
        { roleId: ClocktowerRole.Ravenkeeper },
        { roleId: ClocktowerRole.Virgin },
        { roleId: ClocktowerRole.Slayer },
        { roleId: ClocktowerRole.Soldier },
        { roleId: ClocktowerRole.Mayor },
      ],
      name: "Townsfolk",
    },
    {
      playerCount: dist.outsiders,
      roles: [
        { roleId: ClocktowerRole.Butler },
        { roleId: ClocktowerRole.Drunk },
        { roleId: ClocktowerRole.Recluse },
        { roleId: ClocktowerRole.Saint },
      ],
      name: "Outsiders",
    },
    {
      playerCount: dist.minions,
      roles: [
        { roleId: ClocktowerRole.Poisoner },
        { roleId: ClocktowerRole.Spy },
        { roleId: ClocktowerRole.ScarletWoman },
        { roleId: ClocktowerRole.Baron },
      ],
      name: "Minions",
    },
    {
      playerCount: dist.demons,
      roles: [{ roleId: ClocktowerRole.Imp, max: 1 }],
      name: "Demon",
    },
  ];
}

// ---------------------------------------------------------------------------
// Role definitions (alphabetical by enum key)
// ---------------------------------------------------------------------------

export const CLOCKTOWER_ROLES: Record<
  ClocktowerRole,
  ClocktowerRoleDefinition
> = {
  [ClocktowerRole.Baron]: {
    id: ClocktowerRole.Baron,
    name: "Baron",
    team: Team.Bad,
    characterType: ClocktowerCharacterType.Minion,
    unique: true,
    summary: "Adds two extra Outsiders to the game",
    description:
      "When the Baron is in play, two extra Outsiders are added to the game, replacing two Townsfolk slots. The Storyteller chooses which Townsfolk are replaced.",
    category: "Minion",
  },

  [ClocktowerRole.Butler]: {
    id: ClocktowerRole.Butler,
    name: "Butler",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Outsider,
    unique: true,
    summary: "Must vote the same way as their chosen master",
    description:
      "Each night the Butler chooses a player as their master. The following day, the Butler may only vote to execute if their master also votes to execute that same nomination.",
    category: "Outsider",
  },

  [ClocktowerRole.Chef]: {
    id: ClocktowerRole.Chef,
    name: "Chef",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "On the first night, learns how many pairs of evil neighbors exist",
    description:
      "On the first night only, the Chef learns a number: how many pairs of adjacent seated players are both evil. A pair is two neighbors who are both Minions or the Demon.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Drunk]: {
    id: ClocktowerRole.Drunk,
    name: "Drunk",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Outsider,
    unique: true,
    summary: "Thinks they are a Townsfolk, but their ability never works",
    description:
      "The Drunk does not know they are the Drunk. They are assigned a Townsfolk role token and believe they have that ability — but the ability never actually works. The Storyteller may give them false information.",
    showsFakeTownsfolkToken: true,
    category: "Outsider",
  },

  [ClocktowerRole.Empath]: {
    id: ClocktowerRole.Empath,
    name: "Empath",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary: "Each night, learns how many of their alive neighbors are evil",
    description:
      "Each night the Empath learns a number from 0 to 2: how many of their two nearest alive neighbors (one on each side, in seating order) are evil.",
    category: "Townsfolk",
  },

  [ClocktowerRole.FortuneTeller]: {
    id: ClocktowerRole.FortuneTeller,
    name: "Fortune Teller",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "Each night, chooses two players and learns if either is the Demon",
    description:
      'Each night the Fortune Teller chooses two players and learns "yes" or "no" — whether either of those players is the Demon. The Fortune Teller has one red herring player who always registers as the Demon, even though they are not.',
    category: "Townsfolk",
  },

  [ClocktowerRole.Imp]: {
    id: ClocktowerRole.Imp,
    name: "Imp",
    team: Team.Bad,
    characterType: ClocktowerCharacterType.Demon,
    unique: true,
    summary: "Kills a player each night; can pass Demon status to a Minion",
    description:
      "Each night the Imp chooses a player to kill. If the Imp kills themselves, a living Minion (Storyteller's choice) becomes the new Imp. Good wins by executing the Imp.",
    awareOf: {
      teams: [Team.Bad],
    },
    category: "Demon",
  },

  [ClocktowerRole.Investigator]: {
    id: ClocktowerRole.Investigator,
    name: "Investigator",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "On the first night, learns that one of two shown players is a Minion",
    description:
      "On the first night only, the Investigator is shown two players and told which Minion role one of them is. Exactly one of the two players shown actually holds that Minion role.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Librarian]: {
    id: ClocktowerRole.Librarian,
    name: "Librarian",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "On the first night, learns that one of two shown players is an Outsider",
    description:
      "On the first night only, the Librarian is shown two players and told which Outsider role one of them is. Exactly one of the two players shown actually holds that Outsider role. If no Outsiders are in play, the Librarian learns that instead.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Mayor]: {
    id: ClocktowerRole.Mayor,
    name: "Mayor",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary: "If 3 players remain and no one is executed, Good may win",
    description:
      "If only three players are alive and no execution occurs that day, Good wins — provided the Mayor is still alive. Additionally, if the Mayor would be killed by the Demon at night, the Storyteller may redirect that kill to another player.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Monk]: {
    id: ClocktowerRole.Monk,
    name: "Monk",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary: "Each night (not first), protects a player from the Demon",
    description:
      "Each night except the first, the Monk chooses a player. That player is safe from the Demon's kill this night. The Monk cannot protect themselves.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Poisoner]: {
    id: ClocktowerRole.Poisoner,
    name: "Poisoner",
    team: Team.Bad,
    characterType: ClocktowerCharacterType.Minion,
    unique: true,
    summary: "Each night, poisons a player whose ability malfunctions",
    description:
      "Each night the Poisoner chooses a player to poison. That player's ability malfunctions for the rest of that night and the following day. The Storyteller may give poisoned players false information.",
    category: "Minion",
  },

  [ClocktowerRole.Ravenkeeper]: {
    id: ClocktowerRole.Ravenkeeper,
    name: "Ravenkeeper",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary: "When killed at night, wakes to learn a chosen player's role",
    description:
      "If the Ravenkeeper is killed by the Demon at night, they wake immediately and choose a player. The Storyteller reveals that player's role to the Ravenkeeper.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Recluse]: {
    id: ClocktowerRole.Recluse,
    name: "Recluse",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Outsider,
    unique: true,
    summary: "May register as evil or as a Minion/Demon to other abilities",
    description:
      "The Recluse may register as evil, or as a Minion or Demon, to abilities that check alignment or character type — even though they are Good. The Storyteller decides when and whether the Recluse's registration override applies.",
    registrationOverride: true,
    category: "Outsider",
  },

  [ClocktowerRole.Saint]: {
    id: ClocktowerRole.Saint,
    name: "Saint",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Outsider,
    unique: true,
    summary: "If executed by the town, the Bad team wins immediately",
    description:
      "If the Saint is executed (voted out by the town during the day), the Bad team wins the game immediately.",
    category: "Outsider",
  },

  [ClocktowerRole.ScarletWoman]: {
    id: ClocktowerRole.ScarletWoman,
    name: "Scarlet Woman",
    team: Team.Bad,
    characterType: ClocktowerCharacterType.Minion,
    unique: true,
    summary: "Becomes the Demon if the Demon dies with 5+ players alive",
    description:
      "If the Demon dies while five or more players are alive, the Scarlet Woman immediately becomes the new Demon and the game continues. The Scarlet Woman does not learn they are the Demon until the succession triggers.",
    category: "Minion",
  },

  [ClocktowerRole.Slayer]: {
    id: ClocktowerRole.Slayer,
    name: "Slayer",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "Once per game, publicly claims a player is the Demon — and kills them if correct",
    description:
      "Once per game, during the day, the Slayer may publicly choose a player. If that player is the Demon, the Demon dies immediately. If not, nothing happens. This ability can only be used once.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Soldier]: {
    id: ClocktowerRole.Soldier,
    name: "Soldier",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary: "Cannot be killed by the Demon at night",
    description:
      "The Soldier is immune to the Demon's nightly kill. The Demon's attack on the Soldier fails silently — no other player dies in their place.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Spy]: {
    id: ClocktowerRole.Spy,
    name: "Spy",
    team: Team.Bad,
    characterType: ClocktowerCharacterType.Minion,
    unique: true,
    summary: "Sees the Grimoire; may register as Good to other abilities",
    description:
      "Each night the Spy sees the Grimoire — the complete list of all player roles and game state. The Spy may register as Good or as a Townsfolk to abilities that check alignment or character type.",
    registrationOverride: true,
    category: "Minion",
  },

  [ClocktowerRole.Undertaker]: {
    id: ClocktowerRole.Undertaker,
    name: "Undertaker",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "Each night after an execution, learns the role of the player executed",
    description:
      "On any night after a player was executed that day, the Undertaker wakes and the Storyteller reveals the executed player's true role.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Virgin]: {
    id: ClocktowerRole.Virgin,
    name: "Virgin",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "If nominated by a Townsfolk for the first time, the nominator is executed instead",
    description:
      "The first time the Virgin is nominated, if the nominator is a Townsfolk, the nominator is immediately executed and the nomination ends. This ability can only trigger once.",
    category: "Townsfolk",
  },

  [ClocktowerRole.Washerwoman]: {
    id: ClocktowerRole.Washerwoman,
    name: "Washerwoman",
    team: Team.Good,
    characterType: ClocktowerCharacterType.Townsfolk,
    unique: true,
    summary:
      "On the first night, learns that one of two shown players is a specific Townsfolk",
    description:
      "On the first night only, the Washerwoman is shown two players and told which Townsfolk role one of them is. Exactly one of the two players shown actually holds that Townsfolk role.",
    category: "Townsfolk",
  },
} satisfies Record<ClocktowerRole, ClocktowerRoleDefinition>;

/** Returns true if the given string is a known ClocktowerRole. */
export function isClocktowerRole(id: string): id is ClocktowerRole {
  return id in CLOCKTOWER_ROLES;
}

/** Look up a ClocktowerRoleDefinition by string ID, returning undefined if not found. */
export function getClocktowerRole(
  id: string,
): ClocktowerRoleDefinition | undefined {
  if (!isClocktowerRole(id)) return undefined;
  return CLOCKTOWER_ROLES[id];
}
