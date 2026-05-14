import { Team } from "@/lib/types";

import { TargetCategory,WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const ILLUSION_ARTIST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.IllusionArtist,
  name: "Illusion Artist",
  summary: "Makes the Seer see one player as the opposite alignment",
  description:
    "Each night the Illusion Artist targets one player. If the Seer investigates that player the same night, the Seer receives an inverted result — a Werewolf appears innocent and a non-Werewolf appears guilty. The illusion lasts only for that night.",
  team: Team.Bad,
  unique: true,
  wakesAtNight: WakesAtNight.AfterFirstNight,
  targetCategory: TargetCategory.Special,
  preventRepeatTarget: true,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.EvilSupport,
};
