import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const ALTRUIST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Altruist,
  name: "Altruist",
  summary: "Sacrifices themselves to save an attacked player",
  description:
    "Each night, after the Werewolves have chosen their target, the Altruist learns which players are under attack. They may intercept one attack, saving the original target — but dying in their place. If the Altruist is themselves under attack, their intercept is ignored.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  category: WerewolfRoleCategory.VillagerProtection,
};
