import type { Game } from "@/lib/types";
import { WerewolfRole } from "../roles";

export function isWolfCubDead(newDeadIds: string[], game: Game): boolean {
  const wolfCubId = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.WolfCub as string),
  )?.playerId;
  return !!wolfCubId && newDeadIds.some((id) => id === wolfCubId);
}
