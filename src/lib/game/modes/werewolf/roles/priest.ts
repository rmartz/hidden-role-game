import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const PRIEST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Priest,
  name: "Priest",
  summary: "Places a permanent ward on a player",
  description:
    "The Priest selects a player to place a ward on. The ward persists until the protected player is attacked, at which point the ward is consumed and the Priest selects a new target on the following night.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Protect,
  category: WerewolfRoleCategory.VillagerProtection,
};
