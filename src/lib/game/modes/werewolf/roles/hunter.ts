import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const HUNTER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Hunter,
  name: "Hunter",
  summary: "When killed, eliminates one player of their choice",
  description:
    "When the Hunter dies — whether by wolf attack or village trial — they immediately take one player down with them. The narrator selects the Hunter's revenge target. This revenge kill cannot be blocked by any protection.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  aliases: ["gunslinger"],
  category: WerewolfRoleCategory.VillagerKilling,
};
