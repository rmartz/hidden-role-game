import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const MARTYR_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Martyr,
  name: "Martyr",
  summary: "Once per game, takes the place of a convicted player",
  description:
    "Once per game, after a player is found Guilty but before their role is revealed, the Martyr may step forward to be eliminated in their place. The convicted player survives; the Martyr is eliminated instead. The Martyr cannot use this ability to save themselves.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerProtection,
};
