import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const SEER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Seer,
  name: "Seer",
  summary: "Discovers if a player is evil each night",
  description:
    "Each night the Seer targets one player and the Narrator privately reveals whether that player is a Werewolf. Only Werewolves and Wolf Cubs are detected — other evil roles such as the Minion are not.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Investigate,
  aliases: ["oracle", "prophet"],
  category: WerewolfRoleCategory.VillagerInvestigation,
};
