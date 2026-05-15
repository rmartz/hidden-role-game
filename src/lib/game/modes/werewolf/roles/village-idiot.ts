import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const VILLAGE_IDIOT_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.VillageIdiot,
  name: "Village Idiot",
  summary: "Always votes to convict in daytime trials",
  description:
    "The Village Idiot is a Good-team member who is compelled to always vote Guilty in daytime elimination trials. If the Village Idiot is put on trial and found innocent, the other players will know that a Village Idiot is in the game.",
  team: Team.Good,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  alwaysVotesGuilty: true,
  category: WerewolfRoleCategory.VillagerHandicap,
};
