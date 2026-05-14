import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const EVIL_EMPATH_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.EvilEmpath,
  name: "Evil Empath",
  summary: "Learns each night whether the Seer sits adjacent to a Werewolf",
  description:
    "Each night the Evil Empath senses whether the Seer is seated immediately next to any Werewolf. When the Evil Empath is eliminated, the Werewolves learn the last answer the Evil Empath received.",
  team: Team.Bad,
  unique: true,
  wakesAtNight: WakesAtNight.EveryNight,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.EvilSupport,
};
