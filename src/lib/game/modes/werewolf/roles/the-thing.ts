import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const THE_THING_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.TheThing,
  name: "The Thing",
  summary: "Each night, taps an adjacent player — they know they were tapped",
  description:
    "Each night The Thing selects one of their immediate neighbors (by seating order) to tap. The tapped player learns they were touched in the night, but not by whom. The Thing wins with the village.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  adjacentTargetOnly: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
