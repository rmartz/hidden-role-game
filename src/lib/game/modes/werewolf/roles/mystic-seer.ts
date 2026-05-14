import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const MYSTIC_SEER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.MysticSeer,
  name: "Mystic Seer",
  summary: "Learns a player's exact role each night",
  description:
    "Each night the Mystic Seer targets one player and the Narrator privately reveals that player's exact role — not merely whether they are a Werewolf. This is significantly more powerful than the Seer.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Investigate,
  revealsExactRole: true,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
