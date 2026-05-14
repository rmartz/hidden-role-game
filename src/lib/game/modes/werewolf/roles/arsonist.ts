import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const ARSONIST_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Arsonist,
  name: "Arsonist",
  summary: "Douses players and ignites them all at once",
  description:
    "Each night the Arsonist targets a player. Targeting another player douses them — they remain doused for the rest of the game. Targeting themselves instead ignites every currently doused player simultaneously (protections still apply to each doused player individually). After an ignite, all doused players are reset. The Arsonist is Neutral and wins by surviving to the endgame as the last opposing threat.",
  team: Team.Neutral,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.Special,
  category: WerewolfRoleCategory.NeutralKilling,
};
