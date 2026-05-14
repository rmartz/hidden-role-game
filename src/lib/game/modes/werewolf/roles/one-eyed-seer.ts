import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const ONE_EYED_SEER_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.OneEyedSeer,
  name: "One-Eyed Seer",
  summary: "Investigates players but locks onto detected Werewolves",
  description:
    "Each night the One-Eyed Seer targets one player and the Narrator privately reveals whether that player is a Werewolf (same check as the Seer). However, if the investigation reveals a Werewolf, the One-Eyed Seer is locked on — they cannot investigate any new players until that Werewolf is eliminated.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Investigate,
  category: WerewolfRoleCategory.VillagerInvestigation,
};
