import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

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
