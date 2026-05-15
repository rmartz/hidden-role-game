import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const WITCH_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Witch,
  name: "Witch",
  summary: "Has a one-time power to protect or strike",
  description:
    "After all other night roles have acted, the Witch may use her special ability: either protect the player who was attacked that night, or attack any other player. This ability can only be used once per game.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  aliases: ["potion"],
  category: WerewolfRoleCategory.VillagerProtection,
};
