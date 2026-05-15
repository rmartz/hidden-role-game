import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const GHOST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Ghost,
  name: "Ghost",
  summary:
    "After death, observes nightly activity and leaves clues for the living",
  description:
    "When the Ghost dies, they gain narrator-level visibility into all nightly actions. Each day phase, the Ghost may leave a single short clue (up to 20 characters — a word or letter, no player names) visible to all living players.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.Never,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerSupport,
};
