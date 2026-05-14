import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const TAVERN_KEEPER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.TavernKeeper,
  name: "Tavern Keeper",
  summary: "Role-blocks a player each night before the Werewolves act",
  description:
    "Each night, the Tavern Keeper wakes first — before the Werewolves — and chooses one player to serve too many drinks. The chosen player cannot perform their night action that night. They see a message telling them they are too drunk to stay awake.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
