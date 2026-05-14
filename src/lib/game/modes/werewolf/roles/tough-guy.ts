import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const TOUGH_GUY_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.ToughGuy,
  name: "Tough Guy",
  summary: "Survives the first werewolf attack",
  description:
    "The Tough Guy is a resilient villager who can survive one werewolf attack. After surviving the first attack, the Tough Guy becomes vulnerable and will die normally if attacked again.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerSupport,
};
