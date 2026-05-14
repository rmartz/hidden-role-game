import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const BODYGUARD_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Bodyguard,
  name: "Bodyguard",
  summary: "Protects a player from elimination each night",
  description:
    "Each night the Bodyguard chooses one player to protect. If that player is attacked, they survive. The Bodyguard cannot protect the same player on consecutive nights.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Protect,
  preventRepeatTarget: true,
  category: WerewolfRoleCategory.VillagerProtection,
};
