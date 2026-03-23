import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction } from "../types";
import {
  currentTurnState,
  validateActiveNightPlayer,
  getGroupPhasePlayerIds,
} from "../utils";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";

export const confirmNightTargetAction: GameAction = {
  isValid(game: Game, callerId: string) {
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
    const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      result.activePhaseKey
    ];
    if (roleDef?.dualTargetInvestigate) {
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
