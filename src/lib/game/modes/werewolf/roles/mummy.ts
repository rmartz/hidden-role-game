import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const MUMMY_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mummy,
  name: "Mummy",
  summary: "Hypnotizes a player whose vote mirrors theirs",
  description:
    "Each night the Mummy selects a player to hypnotize. The following day, the hypnotized player's trial vote is automatically cast to match the Mummy's vote. The Mummy selects a new target each night.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  category: WerewolfRoleCategory.VillagerSupport,
};
