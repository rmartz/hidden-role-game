import type { Game } from "@/lib/types";
import type { WerewolfTurnState } from "../types";
import { WerewolfRole } from "../roles";

export function didWolfCubDie(newDeadIds: string[], game: Game): boolean {
  const wolfCubId = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.WolfCub as string),
  )?.playerId;
  return !!wolfCubId && newDeadIds.some((id) => id === wolfCubId);
}

/**
 * Cleans up turn state after a player is killed during the day (trial or narrator kill).
 * - Clears the One-Eyed Seer lock if the locked target was killed.
 * - Consumes priest wards for the killed player.
 * - Triggers Evil Empath reveal when the Evil Empath is killed.
 */
export function cleanupAfterDaytimeKill(
  killedPlayerId: string,
  ts: WerewolfTurnState,
  game: Game,
): void {
  if (ts.oneEyedSeerLockedTargetId === killedPlayerId) {
    ts.oneEyedSeerLockedTargetId = undefined;
  }
  if (ts.priestWards && killedPlayerId in ts.priestWards) {
    const remaining = Object.fromEntries(
      Object.entries(ts.priestWards).filter(([id]) => id !== killedPlayerId),
    );
    ts.priestWards = Object.keys(remaining).length > 0 ? remaining : undefined;
  }
  // Evil Empath: when the Evil Empath is killed during the day, reveal their
  // last adjacency result to Werewolves.
  const evilEmpathId = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.EvilEmpath as string),
  )?.playerId;
  if (
    evilEmpathId === killedPlayerId &&
    ts.evilEmpathLastResult !== undefined &&
    ts.evilEmpathRevealedResult === undefined
  ) {
    ts.evilEmpathRevealedResult = ts.evilEmpathLastResult;
  }
}
