import type { Game } from "@/lib/types";
import { WerewolfRole } from "../roles";

export function isWolfCub(playerId: string, game: Game): boolean {
  return game.roleAssignments.some(
    (a) =>
      a.playerId === playerId &&
      a.roleDefinitionId === (WerewolfRole.WolfCub as string),
  );
}
