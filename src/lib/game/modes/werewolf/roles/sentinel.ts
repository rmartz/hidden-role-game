import { Team } from "@/lib/types";
import { WakesAtNight, TargetCategory } from "../types";
import { WerewolfRole, WerewolfRoleCategory } from "./_types";
import type { WerewolfRoleDefinition } from "./_types";

export const SENTINEL_ROLE: WerewolfRoleDefinition = {
  id: WerewolfRole.Sentinel,
  name: "Sentinel",
  summary: "Knows who the Seer is and can protect their identity",
  description:
    "The Sentinel wakes on the first night and learns the identity of the Seer. They have no night action — their role is to use this knowledge to protect the Seer during daytime discussion without revealing them to the Werewolves.",
  team: Team.Good,
  unique: true,
  awareOf: { roles: [WerewolfRole.Seer] },
  wakesAtNight: WakesAtNight.FirstNightOnly,
  targetCategory: TargetCategory.None,
  category: WerewolfRoleCategory.VillagerSupport,
};
