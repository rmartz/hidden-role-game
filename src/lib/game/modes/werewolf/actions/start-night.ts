import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import type { WerewolfDaytimePhase } from "../types";
import {
  buildNightPhaseOrder,
  currentTurnState,
  isOwnerPlaying,
  GROUP_PHASE_KEY_SEPARATOR,
  checkWinCondition,
} from "../utils";
import { WerewolfRole } from "../roles";

export const startNightAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
    // Cannot advance to night while Hunter revenge is pending
    if (ts.hunterRevengePlayerId) return false;
    // Cannot advance to night while a trial is actively ongoing
    if (ts.phase.activeTrial && !ts.phase.activeTrial.verdict) return false;
    return true;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const dayPhase = ts.phase as WerewolfDaytimePhase;
    const nextTurn = ts.turn + 1;
    // If a Wolf Cub died last turn, Werewolves get an extra phase this night.
    // Use a suffixed key so the second phase has its own nightActions entry.
    const wolfCubBonusPhaseKey =
      WerewolfRole.Werewolf + GROUP_PHASE_KEY_SEPARATOR + "2";
    const extraGroupPhaseKeys = ts.wolfCubDied ? [wolfCubBonusPhaseKey] : [];
    const nightPhaseOrder = buildNightPhaseOrder(
      nextTurn,
      game.roleAssignments,
      ts.deadPlayerIds,
      extraGroupPhaseKeys,
    );
    // Carry over any pending daytime smites into the night phase so they are
    // resolved at the end of this night (in start-day).
    const pendingSmites = dayPhase.pendingSmitePlayerIds?.filter(
      (id) => !ts.deadPlayerIds.includes(id),
    );

    // Dracula: carry forward wives (filtering out the dead) and check win condition.
    // Dracula wins if alive and ≥3 wives are alive at the start of any night
    // (after the first full day-and-night cycle, i.e. turn > 1).
    const aliveWives = (ts.draculaWives ?? []).filter(
      (id) => !ts.deadPlayerIds.includes(id),
    );

    // Zombie: carry forward infected list (filtering out the dead).
    const aliveInfected = (ts.zombieInfected ?? []).filter(
      (id) => !ts.deadPlayerIds.includes(id),
    );

    game.status = {
      type: GameStatus.Playing,
      turnState: {
        turn: nextTurn,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: Date.now(),
          nightPhaseOrder,
          currentPhaseIndex: 0,
          nightActions: {},
          ...(pendingSmites?.length ? { smitedPlayerIds: pendingSmites } : {}),
        },
        deadPlayerIds: ts.deadPlayerIds,
        ...(ts.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
        ...(ts.lastTargets ? { lastTargets: ts.lastTargets } : {}),
        ...(ts.priestWards ? { priestWards: ts.priestWards } : {}),
        ...(ts.toughGuyHitIds?.length
          ? { toughGuyHitIds: ts.toughGuyHitIds }
          : {}),
        // One-Eyed Seer: carry forward lock unless the locked target is now dead.
        ...(ts.oneEyedSeerLockedTargetId &&
        !ts.deadPlayerIds.includes(ts.oneEyedSeerLockedTargetId)
          ? { oneEyedSeerLockedTargetId: ts.oneEyedSeerLockedTargetId }
          : {}),
        ...(ts.exposerAbilityUsed ? { exposerAbilityUsed: true } : {}),
        ...(ts.morticianAbilityEnded ? { morticianAbilityEnded: true } : {}),
        ...(ts.exposerReveal ? { exposerReveal: ts.exposerReveal } : {}),
        ...(ts.executionerTargetId
          ? { executionerTargetId: ts.executionerTargetId }
          : {}),
        ...(ts.mirrorcasterCharged ? { mirrorcasterCharged: true } : {}),
        ...(aliveWives.length > 0 ? { draculaWives: aliveWives } : {}),
        ...(aliveInfected.length > 0 ? { zombieInfected: aliveInfected } : {}),
      },
    };

    // Dracula wins at the start of night if they are alive and have ≥3 wives alive.
    // This is only checked from turn 2 onward (after at least one full day cycle).
    if (nextTurn > 1) {
      const winResult = checkWinCondition(game, ts.deadPlayerIds);
      if (winResult) {
        game.status = winResult;
      }
    }
  },
};
