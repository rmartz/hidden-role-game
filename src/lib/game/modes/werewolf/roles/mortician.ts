import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const MORTICIAN_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Mortician,
  name: "Mortician",
  summary: "Attacks each night until they kill a Werewolf",
  description:
    "Each night, the Mortician targets one player to attack. If the target is protected, the attack fails and the Mortician receives a 'not a Werewolf' result regardless of the target's actual role. Once the Mortician successfully kills a Werewolf, their ability ends and they no longer wake at night.",
  team: Team.Good,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Attack,
  preventSelfTarget: true,
  category: WerewolfRoleCategory.VillagerKilling,
};
