import { Team } from "@/lib/types";

import type { ClocktowerRoleDefinition } from "./_types";
import { ClocktowerCharacterType, ClocktowerRole } from "./_types";

export const CLOCKTOWER_DEMON_ROLES: Record<
  ClocktowerRole.Imp,
  ClocktowerRoleDefinition
> = {
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
};
