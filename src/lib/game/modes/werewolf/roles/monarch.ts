import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MONARCH_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Monarch,
  name: "Monarch",
  summary: "Knights up to 3 players who each gain +1 trial vote",
  description:
    "Each night, the Monarch may knight one player (up to 3 times per game). Knighted players are publicly known and each gains +1 vote in daytime trials while alive. As long as at least one living Knighted player remains, the Monarch is protected from normal night attacks — except when bad-aligned attackers strike while all living Knighted players are bad-aligned, or when the only living Knighted player is among the attackers.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.VillagerSupport,
};
