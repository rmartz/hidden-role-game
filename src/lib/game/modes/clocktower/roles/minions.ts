import { Team } from "@/lib/types";

import type { ClocktowerRoleDefinition } from "./_types";
import { ClocktowerCharacterType, ClocktowerRole } from "./_types";

export const CLOCKTOWER_MINION_ROLES: Record<
  | ClocktowerRole.Baron
  | ClocktowerRole.Poisoner
  | ClocktowerRole.ScarletWoman
  | ClocktowerRole.Spy,
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
};
