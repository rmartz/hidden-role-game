import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const MINION_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Minion,
  name: "Minion",
  summary: "A secret servant of the werewolves",
  description:
    "The Minion knows who the Werewolves are, but the Werewolves do not know the Minion's identity. The Minion wins with the Werewolves. The Seer's investigation reveals the Minion is not a Werewolf.",
  team: Team.Bad,
  unique: true,
  awareOf: { werewolves: true },
  wakesAtNight: WakesAtNight.FirstNightOnly,
  targetCategory: TargetCategory.None,
  aliases: ["servant", "thrall"],
  category: WerewolfRoleCategory.EvilSupport,
};
