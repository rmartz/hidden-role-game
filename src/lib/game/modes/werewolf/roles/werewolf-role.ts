import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const WEREWOLF_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Werewolf,
  name: "Werewolf",
  summary: "Eliminates a villager each night",
  description:
    "Each night the Werewolves wake together to choose their victim. They know which other players share their night phase, but not each other's specific roles.",
  team: Team.Bad,
  isWerewolf: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Attack,
  teamTargeting: true,
  aliases: ["wolf", "wolves"],
  category: WerewolfRoleCategory.EvilKilling,
};
