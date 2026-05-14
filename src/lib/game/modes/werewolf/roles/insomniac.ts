import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const INSOMNIAC_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Insomniac,
  name: "Insomniac",
  summary: "Each night, learns if either neighbor woke and acted",
  description:
    "Each night, after all other roles have acted, the Insomniac learns whether their left neighbor and right neighbor (by seating order) woke and performed a night action. A neighbor with no night role always returns no.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
