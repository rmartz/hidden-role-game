import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import { getWerewolfModeConfig } from "../lobby-config";
import { WerewolfRole } from "../roles";
import type { WerewolfDaytimePhase, WerewolfRoleTurnState } from "../types";
import { WerewolfPhase } from "../types";
import {
  buildNightPhaseOrder,
  currentTurnState,
  GROUP_PHASE_KEY_SEPARATOR,
  isOwnerPlaying,
  WerewolfWinner,
  withMercenaryCoWin,
} from "../utils";

/** Night at which the Village Drunk sobers up and gains their alternate role. */
const VILLAGE_DRUNK_SOBER_TURN = 3;

export const startNightAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
    // Cannot advance to night while Hunter revenge is pending
    if (ts.roleState?.hunter?.revengePlayerId) return false;
    // Cannot advance to night while a trial is actively ongoing
    if (ts.phase.activeTrial && !ts.phase.activeTrial.verdict) return false;
    return true;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const dayPhase = ts.phase as WerewolfDaytimePhase;
    const nextTurn = ts.turn + 1;
    const rs = ts.roleState ?? {};
    // If a Wolf Cub died last turn, Werewolves get an extra phase this night.
    // Use a suffixed key so the second phase has its own nightActions entry.
    const wolfCubBonusPhaseKey =
      WerewolfRole.Werewolf + GROUP_PHASE_KEY_SEPARATOR + "2";
    const extraGroupPhaseKeys = rs.wolfCub?.died ? [wolfCubBonusPhaseKey] : [];

    // Village Drunk: sober up on VILLAGE_DRUNK_SOBER_TURN.
    // Apply the sober role override before building the night phase order so
    // the sober role's night phase is included in the order if it wakes at night.
    let roleOverrides = ts.roleOverrides ? { ...ts.roleOverrides } : undefined;
    if (nextTurn === VILLAGE_DRUNK_SOBER_TURN) {
      const modeConfig = getWerewolfModeConfig(game);
      const soberRoleId = modeConfig.villageDrunkSoberRoleId;
      if (soberRoleId) {
        const drunkAssignment = game.roleAssignments.find(
          (a) =>
            a.roleDefinitionId === (WerewolfRole.VillageDrunk as string) &&
            !ts.deadPlayerIds.includes(a.playerId),
        );
        if (drunkAssignment) {
          const effectiveDrunkRole =
            roleOverrides?.[drunkAssignment.playerId] ??
            drunkAssignment.roleDefinitionId;
          if (effectiveDrunkRole === (WerewolfRole.VillageDrunk as string)) {
            roleOverrides = {
              ...(roleOverrides ?? {}),
              [drunkAssignment.playerId]: soberRoleId,
            };
          }
        }
      }
    }

    // Build effective role assignments for night-phase-order calculation,
    // applying any role overrides (including the just-applied Village Drunk sober).
    const effectiveAssignments = roleOverrides
      ? game.roleAssignments.map((a) => {
          const override = roleOverrides[a.playerId];
          return override ? { ...a, roleDefinitionId: override } : a;
        })
      : game.roleAssignments;

    const nightPhaseOrder = buildNightPhaseOrder(
      nextTurn,
      effectiveAssignments,
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
    const aliveWives = (rs.dracula?.wives ?? []).filter(
      (id) => !ts.deadPlayerIds.includes(id),
    );

    // Zombie: carry forward infected list (filtering out the dead).
    const aliveInfected = (rs.zombie?.infected ?? []).filter(
      (id) => !ts.deadPlayerIds.includes(id),
    );

    // Arsonist: carry forward doused list (filtering out the dead).
    const aliveDousedPlayerIds = (rs.arsonist?.dousedPlayerIds ?? []).filter(
      (id) => !ts.deadPlayerIds.includes(id),
    );

    // Build the new roleState: carry forward persistent role state, reset wolfCub.
    // One-Eyed Seer lock is dropped if the locked target is now dead.
    const newRoleState: WerewolfRoleTurnState = {
      ...(rs.alphaWolf?.biteUsed ? { alphaWolf: rs.alphaWolf } : {}),
      ...(rs.witch?.abilityUsed ? { witch: rs.witch } : {}),
      ...(rs.priest?.wards ? { priest: rs.priest } : {}),
      ...(rs.toughGuy?.hitIds.length ? { toughGuy: rs.toughGuy } : {}),
      ...(rs.oneEyedSeer?.lockedTargetId &&
      !ts.deadPlayerIds.includes(rs.oneEyedSeer.lockedTargetId)
        ? { oneEyedSeer: rs.oneEyedSeer }
        : {}),
      ...(rs.exposer?.abilityUsed || rs.exposer?.reveal
        ? { exposer: rs.exposer }
        : {}),
      ...(rs.mortician?.abilityEnded ? { mortician: rs.mortician } : {}),
      ...(rs.monarch ? { monarch: rs.monarch } : {}),
      ...(rs.executioner?.targetId ? { executioner: rs.executioner } : {}),
      ...(rs.mirrorcaster?.charged ? { mirrorcaster: rs.mirrorcaster } : {}),
      ...(rs.mercenary?.charged || rs.mercenary?.bribedPlayerIds.length
        ? { mercenary: rs.mercenary }
        : {}),
      ...(aliveWives.length > 0 ? { dracula: { wives: aliveWives } } : {}),
      ...(aliveInfected.length > 0
        ? { zombie: { infected: aliveInfected } }
        : {}),
      ...(aliveDousedPlayerIds.length > 0
        ? { arsonist: { dousedPlayerIds: aliveDousedPlayerIds } }
        : {}),
      ...(rs.veteran ? { veteran: rs.veteran } : {}),
      // wolfCub.died is intentionally NOT carried forward — consumed by this night's bonus phase
    };

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
        ...(ts.lastTargets ? { lastTargets: ts.lastTargets } : {}),
        ...(roleOverrides ? { roleOverrides } : {}),
        ...(Object.keys(newRoleState).length > 0
          ? { roleState: newRoleState }
          : {}),
      },
    };

    // Dracula wins at the start of night if alive and ≥3 wives are alive.
    // Only checked from turn 2 onward — wives can't accumulate on turn 1.
    if (nextTurn > 1 && aliveWives.length >= 3) {
      const draculaAssignment = game.roleAssignments.find(
        (a) => a.roleDefinitionId === (WerewolfRole.Dracula as string),
      );
      if (
        draculaAssignment &&
        !ts.deadPlayerIds.includes(draculaAssignment.playerId)
      ) {
        game.status = withMercenaryCoWin(
          { type: GameStatus.Finished, winner: WerewolfWinner.Dracula },
          game,
          ts.deadPlayerIds,
        );
        return;
      }
    }
  },
};
