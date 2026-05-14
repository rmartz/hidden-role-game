import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const SPELLCASTER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Spellcaster,
  name: "Spellcaster",
  summary: "Silences a player each night",
  description:
    "Each night the Spellcaster targets one player who is silenced the following day and cannot speak. The Spellcaster cannot target the same player on consecutive nights.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventRepeatTarget: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
