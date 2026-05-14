import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const THE_THING_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.TheThing,
  name: "The Thing",
  summary:
    "From night 2 onward, taps an adjacent player — they know they were tapped",
  description:
    "Starting on the second night, The Thing selects one of their immediate neighbors (by seating order) to tap. The tapped player learns they were touched in the night, but not by whom. The Thing wins with the village.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.AfterFirstNight,
  targetCategory: TargetCategory.Special,
  adjacentTargetOnly: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
