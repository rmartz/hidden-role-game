import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const WOLF_CUB_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.WolfCub,
  name: "Wolf Cub",
  summary: "A young werewolf who joins the nightly hunt",
  description:
    "The Wolf Cub wakes with the Werewolves and participates in their nightly attack. If the Wolf Cub is ever eliminated, the Werewolves gain two attack phases the following night.",
  team: Team.Bad,
  isWerewolf: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Attack,
  wakesWith: WerewolfRole.Werewolf,
  category: WerewolfRoleCategory.EvilKilling,
};
