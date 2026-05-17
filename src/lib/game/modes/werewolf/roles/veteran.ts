import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const VETERAN_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Veteran,
  name: "Veteran",
  summary:
    "Goes on alert each night; repels werewolves and counter-kills any visiting player",
  description:
    "Each night the Veteran may choose to go on Alert (up to 3 times). While Alerted, the Veteran repels any werewolf attack — one participating wolf dies instead — and counter-kills any other player who physically visits them (Protect and Attack category roles, plus Mirrorcaster which physically visits regardless of its Special category, and Mercenary in Protect/uncharged mode which also physically visits). Investigation and other Special roles, which observe from afar or act non-physically, are not affected; a charged Mercenary (Bribe mode) is likewise exempt. If the Veteran does not Alert, they are treated as a normal Villager for that night.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerProtection,
};
