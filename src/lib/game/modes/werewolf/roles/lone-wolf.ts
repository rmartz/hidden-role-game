import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const LONE_WOLF_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.LoneWolf,
  name: "Lone Wolf",
  summary: "A rogue werewolf with its own win condition",
  description:
    "The Lone Wolf wakes with the Werewolves each night and participates in their hunt. Werewolves do not know which of their wake partners is the Lone Wolf. The Lone Wolf wins alone — if they are the last wolf-aligned player alive and outnumber or match non-wolf players, the Lone Wolf wins instead of Team Bad.",
  team: Team.Neutral,
  isWerewolf: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.None,
  wakesWith: WerewolfRole.Werewolf,
  awareOf: { werewolves: true },
  category: WerewolfRoleCategory.NeutralKilling,
};
