import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MERCENARY_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mercenary,
  name: "Mercenary",
  summary:
    "Protects players for coins; bribes players to tie win condition to their team",
  description:
    "The Mercenary is a Neutral player who alternates between two modes each night. In Protect mode (uncharged), they shield one player — if that player would have been killed, the Mercenary earns a coin and switches to Bribe mode. In Bribe mode (charged), they spend the coin to bribe one player, tying their win condition to that player's team. The Mercenary wins at game end if they are alive and at least one bribed player is alive on the winning team. A bribed player is unaware they have been bribed.",
  team: Team.Neutral,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.NeutralManipulation,
};
