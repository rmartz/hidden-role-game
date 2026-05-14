import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const SPOILER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Spoiler,
  name: "Spoiler",
  summary: "Wins whenever anyone else wins",
  description:
    "The Spoiler is a Neutral player who wins whenever a standard win condition is met — as long as the Spoiler is still alive. If the Village wins, the Spoiler wins. If the Werewolves win, the Spoiler wins instead.",
  team: Team.Neutral,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.NeutralManipulation,
};
