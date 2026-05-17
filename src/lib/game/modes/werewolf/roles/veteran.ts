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
    "Each night the Veteran may choose to go on Alert (up to 3 times). While Alerted, the Veteran repels any werewolf attack — one participating wolf dies instead — and counter-kills physical visitors. Physical visitors include Protect and Attack category roles, Mirrorcaster (which physically visits despite its Special category), and uncharged Mercenary in Protect mode. Investigation and other Special roles are exempt, as is charged Mercenary in Bribe mode. If the Veteran does not Alert, they are treated as a normal Villager for that night.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerProtection,
};
