import { Team } from "@/lib/types";

import { TargetCategory, WakesAtNight } from "../types";
import type { WerewolfRoleDefinition } from "./_types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";

export const CHUPACABRA_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Chupacabra,
  name: "Chupacabra",
  summary: "A neutral predator that hunts Werewolves",
  description:
    "Each night the Chupacabra targets one player. The attack only succeeds if the target is a Werewolf — once all Werewolves have been eliminated, the Chupacabra can attack anyone. The Chupacabra is neutral and has its own win condition.",
  team: Team.Neutral,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Attack,
  category: WerewolfRoleCategory.NeutralKilling,
};
