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
  const rs = ts.roleState;
  if (rs?.oneEyedSeer?.lockedTargetId === killedPlayerId) {
    ts.roleState = { ...rs, oneEyedSeer: undefined };
  }
  const wards = ts.roleState?.priest?.wards;
  if (wards && killedPlayerId in wards) {
    const remaining = Object.fromEntries(
      Object.entries(wards).filter(([id]) => id !== killedPlayerId),
    );
    ts.roleState = {
      ...(ts.roleState ?? {}),
      priest:
        Object.keys(remaining).length > 0 ? { wards: remaining } : undefined,
    };
  }
  // Evil Empath: when the Evil Empath is killed during the day, reveal their
  // last adjacency result to Werewolves.
  const evilEmpathId = game.roleAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.EvilEmpath as string),
  )?.playerId;
  const evilEmpathState = ts.roleState?.evilEmpath;
  if (
    evilEmpathId === killedPlayerId &&
    evilEmpathState?.lastResult !== undefined &&
    evilEmpathState.revealedResult === undefined
  ) {
    ts.roleState = {
      ...ts.roleState,
      evilEmpath: {
        ...evilEmpathState,
        revealedResult: evilEmpathState.lastResult,
      },
    };
  }
}
