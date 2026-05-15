import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const DRACULA_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Dracula,
  name: "Dracula",
  summary:
    "Claims wives each night; wins with 3 wives alive after a full cycle",
  description:
    "Each night Dracula selects one player to become a wife. Wives retain their original roles and are unaware of their status. If Dracula is alive and at least 3 wives are simultaneously alive at the start of any night, Dracula wins. Dracula may skip their night action.",
  team: Team.Neutral,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.NeutralManipulation,
};
