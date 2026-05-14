import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const ALPHA_WOLF_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.AlphaWolf,
  name: "Alpha Wolf",
  summary:
    "Once per game, converts a villager to the Werewolf team instead of killing",
  description:
    "The Alpha Wolf wakes with the Werewolves each night. Once per game, instead of a standard kill, the Alpha Wolf may bite a villager — secretly converting them to the Werewolf team. Alternatively, the Alpha Wolf may use their ability to eliminate an additional villager that same night.",
  team: Team.Bad,
  isWerewolf: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  wakesWith: WerewolfRole.Werewolf,
  awareOf: { werewolves: true },
  oncePerGame: true,
  unique: true,
  category: WerewolfRoleCategory.EvilKilling,
};
