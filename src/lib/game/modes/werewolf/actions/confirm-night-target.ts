import type { Game, GameAction } from "@/lib/types";

import { getWerewolfRole } from "../roles";
import { isTeamNightAction, WerewolfPhase } from "../types";
import {
  currentTurnState,
  getGroupPhasePlayerIds,
  isGroupPhaseKey,
  validateActiveNightPlayer,
} from "../utils";

export const confirmNightTargetAction: GameAction = {
  isValid(game: Game, callerId: string) {
    // Narrator can confirm for no-device players on any solo phase.
    if (callerId === game.ownerPlayerId) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
      if (ts.turn <= 1) return false;
      const phase = ts.phase;
      const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (!activePhaseKey || isGroupPhaseKey(activePhaseKey)) return false;
      const action = phase.nightActions[activePhaseKey];
      if (!action || action.confirmed) return false;
      // Mentalist requires both targets to be set (unless skipping entirely).
      // Swapper also requires both targets to be set (unless skipping entirely).
      const roleDef = getWerewolfRole(activePhaseKey);
      if (roleDef?.dualTargetInvestigate || roleDef?.dualTargetSwap) {
        if (!isTeamNightAction(action) && !action.skipped) {
          if (!action.targetPlayerId || !action.secondTargetPlayerId)
            return false;
        }
      }
      return true;
    }

    const result = validateActiveNightPlayer(game, callerId);
    if (!result) return false;

    const action = result.phase.nightActions[result.activePhaseKey];
    if (!action) return false;
    if (action.confirmed) return false;

    if (result.isGroupPhase) {
      // Group phase: all alive participants must agree (same target or all skip).
      if (!isTeamNightAction(action)) return false;
      const ts = currentTurnState(game);
      const aliveParticipantIds = getGroupPhasePlayerIds(
        game.roleAssignments,
        result.activePhaseKey,
        ts?.deadPlayerIds ?? [],
      );
      if (aliveParticipantIds.length === 0) return false;
      const aliveVotes = action.votes.filter((v) =>
        aliveParticipantIds.includes(v.playerId),
      );
      // All alive participants must have voted.
      const voterIds = new Set(aliveVotes.map((v) => v.playerId));
      if (voterIds.size !== aliveParticipantIds.length) return false;
      // All must agree: either all skipped, or all voted for the same target.
      const allSkipped = aliveVotes.every((v) => v.skipped === true);
      if (allSkipped) return true;
      const targets = new Set(
        aliveVotes.filter((v) => !v.skipped).map((v) => v.targetPlayerId),
      );
      return targets.size === 1 && !aliveVotes.some((v) => v.skipped);
    }

    // Mentalist requires both targets to be set (unless skipping entirely).
    // Swapper also requires both targets to be set (unless skipping entirely).
    const roleDef = getWerewolfRole(result.activePhaseKey);
    if (roleDef?.dualTargetInvestigate || roleDef?.dualTargetSwap) {
      if (!isTeamNightAction(action) && !action.skipped) {
        if (!action.targetPlayerId || !action.secondTargetPlayerId)
          return false;
      }
    }

    // Solo phase: action must exist (has a target or is an intentional skip).
    return true;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return;

    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!activePhaseKey) return;

    const action = phase.nightActions[activePhaseKey];
    if (action) {
      phase.nightActions[activePhaseKey] = { ...action, confirmed: true };
    }

    // witchAbilityUsed and exposerAbilityUsed are set in start-day
    // during night resolution, so both player and narrator paths are handled.
  },
};
