import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const VETERAN_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Veteran,
  name: "Veteran",
  summary:
    "Goes on alert each night; repels werewolves and counter-kills any visiting player",
  description:
    "Each night the Veteran may choose to go on Alert (up to 3 times). While Alerted, the Veteran repels any werewolf attack — one participating wolf dies instead — and counter-kills any other player who physically visits them (Protect and Attack category roles). Investigation and Special roles, which observe from afar or act non-physically, are not affected. If the Veteran does not Alert, they are treated as a normal Villager for that night.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerProtection,
};
