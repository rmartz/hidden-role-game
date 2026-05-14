import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MIRRORCASTER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mirrorcaster,
  name: "Mirrorcaster",
  summary: "Protects players; gains an attack charge when protection succeeds",
  description:
    "The Mirrorcaster starts in Protect mode, choosing a player to shield each night. When the protected player is attacked, the Mirrorcaster gains a charge and switches to Attack mode. Their next night action is an attack (blockable by protections). After attacking, the charge is consumed and they return to Protect mode.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.VillagerProtection,
};
