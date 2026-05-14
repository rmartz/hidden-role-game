import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const ELUSIVE_SEER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.ElusiveSeer,
  name: "Elusive Seer",
  summary: "On the first night, learns every plain Villager",
  description:
    "On the first night only, the Elusive Seer wakes and is shown the identity of every plain Villager in the game. They have no night action on subsequent nights.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.FirstNightOnly,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
