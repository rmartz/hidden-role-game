import { WerewolfRole } from "../../roles";
import type { AttackNightResolutionEvent } from "../../types";
import type { resolveNightActions } from "../resolution";

export function findKilled(
  events: ReturnType<typeof resolveNightActions>,
  targetPlayerId: string,
): AttackNightResolutionEvent | undefined {
  return events.find(
    (e): e is AttackNightResolutionEvent =>
      e.type === "killed" && e.targetPlayerId === targetPlayerId,
  );
}

export const assignments = [
  { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
  { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
  { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "p2", roleDefinitionId: WerewolfRole.Villager },
  { playerId: "chup1", roleDefinitionId: WerewolfRole.Chupacabra },
  { playerId: "witch1", roleDefinitionId: WerewolfRole.Witch },
  { playerId: "sc1", roleDefinitionId: WerewolfRole.Spellcaster },
];
