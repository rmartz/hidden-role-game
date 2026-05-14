import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const EXECUTIONER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Executioner,
  name: "Executioner",
  summary: "Wins by getting their target eliminated at trial",
  description:
    "The Executioner is a Neutral player assigned a secret target at the start of the game. If the Executioner's target is eliminated by a daytime trial vote — and the Executioner is still alive — the Executioner wins.",
  team: Team.Neutral,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.NeutralManipulation,
};
