import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const SWAPPER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Swapper,
  name: "Swapper",
  summary: "Swaps the night effects of two players",
  description:
    "Each night, the Swapper selects two living players (including themselves). At the end of the night, the final night effects of those two players are swapped — if one would be eliminated, silenced, or hypnotized, the other player suffers that effect instead. Investigations are unaffected. Protections also switch, so an attack-and-protection on one player moves fully to the other.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  dualTargetSwap: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
