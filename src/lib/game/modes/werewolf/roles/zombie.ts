import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const ZOMBIE_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Zombie,
  name: "Zombie",
  summary: "Infects players; wins when infected outnumber healthy",
  description:
    "Each night the Zombie infects one player. Infected players continue normally under their original roles and are unaware of their status. After every death, if the number of living infected players exceeds the number of living non-infected players (excluding the Zombie), the Zombie wins. The Zombie cannot infect a player who is already infected.",
  team: Team.Neutral,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.NeutralKilling,
};
