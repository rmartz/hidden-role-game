import { Team } from "@/lib/types";

import type { ClocktowerRoleDefinition } from "./_types";
import { ClocktowerCharacterType, ClocktowerRole } from "./_types";

export const CLOCKTOWER_TOWNSFOLK_ROLES: Record<
  | ClocktowerRole.Chef
  | ClocktowerRole.Empath
  | ClocktowerRole.FortuneTeller
  | ClocktowerRole.Investigator
  | ClocktowerRole.Librarian
  | ClocktowerRole.Mayor
  | ClocktowerRole.Monk
  | ClocktowerRole.Ravenkeeper
  | ClocktowerRole.Slayer
  | ClocktowerRole.Soldier
  | ClocktowerRole.Undertaker
  | ClocktowerRole.Virgin
  | ClocktowerRole.Washerwoman,
  ClocktowerRoleDefinition
> = {
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
};
