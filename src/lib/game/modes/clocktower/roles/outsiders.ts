import { Team } from "@/lib/types";

import type { ClocktowerRoleDefinition } from "./_types";
import { ClocktowerCharacterType, ClocktowerRole } from "./_types";

export const CLOCKTOWER_OUTSIDER_ROLES: Record<
  | ClocktowerRole.Butler
  | ClocktowerRole.Drunk
  | ClocktowerRole.Recluse
  | ClocktowerRole.Saint,
  ClocktowerRoleDefinition
> = {
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
};
