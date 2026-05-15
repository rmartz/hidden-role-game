import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MASON_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mason,
  name: "Mason",
  summary: "Knows the identities of all other Masons",
  description:
    "On the first night, the Masons learn who the other Masons are. Masons have no night action after the first night, but they can trust each other completely.",
  team: Team.Good,
  awareOf: { roles: [WerewolfRole.Mason] },
  wakesAtNight: WakesAtNight.FirstNightOnly,
  targetCategory: TargetCategory.None,
  aliases: ["brother", "freemason"],
  category: WerewolfRoleCategory.VillagerSupport,
};
