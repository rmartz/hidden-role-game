import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const COUNT_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Count,
  name: "The Count",
  summary: "On night 1, learns the werewolf count in each half of the table",
  description:
    "On the first night only, The Count wakes and learns how many werewolf-aligned players are seated in the left half versus the right half of the table. They have no night action on subsequent nights.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.FirstNightOnly,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
