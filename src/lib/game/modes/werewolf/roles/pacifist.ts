import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const PACIFIST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Pacifist,
  name: "Pacifist",
  summary: "Always votes to acquit in daytime trials",
  description:
    "The Pacifist is a Good-team member who is compelled to always vote Innocent in daytime elimination trials. Their vote is automatically cast when a trial begins.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  alwaysVotesInnocent: true,
  category: WerewolfRoleCategory.VillagerHandicap,
};
