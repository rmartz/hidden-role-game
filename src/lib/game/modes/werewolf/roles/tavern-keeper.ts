import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const TAVERN_KEEPER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.TavernKeeper,
  name: "Tavern Keeper",
  summary: "Retroactively undoes a player's night action each night",
  description:
    "Each night, the Tavern Keeper wakes and serves too many drinks to one player. In the morning, that player's night action is revealed to have had no effect — they awoke with a hangover. Investigative roles are unaffected.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
