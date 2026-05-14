import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const EXPOSER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Exposer,
  name: "Exposer",
  summary: "Once per game, publicly reveals a player's role",
  description:
    "Once per game, the Exposer may target a player at night. When confirmed, that player's role is publicly revealed to all players at the start of the following day. This ability can only be used once.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  oncePerGame: true,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
