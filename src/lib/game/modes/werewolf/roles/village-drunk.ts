import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const VILLAGE_DRUNK_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.VillageDrunk,
  name: "Village Drunk",
  summary:
    "Cannot speak normally; gets sober on night 3 and gains an alternate role",
  description:
    "The Village Drunk is mute until they sober up. At the start of night 3, the Village Drunk sobers up and takes on an alternate role (configured by the narrator before the game starts). From that point they play as that new role.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerHandicap,
};
