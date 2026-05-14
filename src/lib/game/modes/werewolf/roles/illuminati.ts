import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const ILLUMINATI_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Illuminati,
  name: "Illuminati",
  summary: "Sees all roles on night 1; wins if alive in the final 3",
  description:
    "On the first night, the Illuminati wakes and the Narrator reveals every player's role. They have no night action after night 1. The Illuminati wins if they are one of the last 3 players alive when the game ends.",
  team: Team.Neutral,
  unique: true,
  wakesAtNight: WakesAtNight.FirstNightOnly,
  targetCategory: TargetCategory.None,
  revealsFullRoleList: true,
  category: WerewolfRoleCategory.NeutralManipulation,
};
