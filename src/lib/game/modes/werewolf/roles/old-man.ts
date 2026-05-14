import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const OLD_MAN_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.OldMan,
  name: "Old Man",
  summary: "Dies peacefully after a set number of nights",
  description:
    "The Old Man has no special protections — wolves can attack and kill them normally. However, if the Old Man is still alive after (#Werewolves + 2) nights, they die peacefully in their sleep at the start of day.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerHandicap,
};
