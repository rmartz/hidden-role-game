import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const VIGILANTE_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Vigilante,
  name: "Vigilante",
  summary: "Kills a player each night starting night 2; dies if target is Good",
  description:
    "Starting on the second night, the Vigilante may choose one player to eliminate. If the target is protected, the kill is blocked. If the Vigilante successfully kills a Good-team player, the Vigilante also dies at the start of the following day.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.AfterFirstNight,
  targetCategory: TargetCategory.Attack,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.VillagerKilling,
};
