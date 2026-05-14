import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MENTALIST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mentalist,
  name: "Mentalist",
  summary: "Learns if two chosen players share the same team",
  description:
    "Each night the Mentalist selects two players and the Narrator privately reveals whether those two players are on the same team. The Mentalist does not learn either player's specific role — only whether their teams match.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Investigate,
  dualTargetInvestigate: true,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
