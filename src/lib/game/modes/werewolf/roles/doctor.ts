import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const DOCTOR_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Doctor,
  name: "Doctor",
  summary: "Protects a player from elimination each night",
  description:
    "Each night the Doctor chooses one player to protect from werewolf attacks. Unlike the Bodyguard, the Doctor can protect the same player on consecutive nights but cannot protect themselves.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Protect,
  preventSelfTarget: true,
  aliases: ["healer", "medic"],
  category: WerewolfRoleCategory.VillagerProtection,
};
