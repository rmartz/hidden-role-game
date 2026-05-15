import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const WIZARD_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Wizard,
  name: "Wizard",
  summary: "Aligned with the Werewolves, secretly hunts the Seer",
  description:
    "The Wizard wins with the Werewolves but operates alone — the wolves don't know the Wizard, and the Wizard doesn't know the wolves. Each night the Wizard targets one player and the Narrator privately reveals whether that player is the Seer. The Seer's own investigation returns 'not a Werewolf' for the Wizard.",
  team: Team.Bad,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Investigate,
  checksForSeer: true,
  category: WerewolfRoleCategory.EvilSupport,
};
