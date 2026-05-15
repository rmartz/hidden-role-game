import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const TANNER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Tanner,
  name: "Tanner",
  summary: "Wins by getting eliminated",
  description:
    "The Tanner is a Neutral player who wins by being eliminated — either by the Werewolves at night or by the village at trial. The Tanner has no special abilities and no night action.",
  team: Team.Neutral,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.NeutralManipulation,
};
