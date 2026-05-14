import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MAYOR_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mayor,
  name: "Mayor",
  summary: "Vote counts double in daytime trials",
  description:
    "The Mayor is a Good-team member whose vote secretly counts double in daytime elimination trials. No one else knows the Mayor's identity.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerSupport,
};
