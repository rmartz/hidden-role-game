import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const VILLAGER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Villager,
  name: "Villager",
  summary: "An ordinary member of the village",
  description:
    "The Villager has no special abilities and no night action. They must rely on their wits and discussion during the day to identify and eliminate the Werewolves.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  aliases: ["peasant", "town", "townsfolk"],
  category: WerewolfRoleCategory.VillagerSupport,
};
