import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction } from "../types";
import {
  currentTurnState,
  validateActiveNightPlayer,
  getGroupPhasePlayerIds,
} from "../utils";
import { WerewolfRole, getWerewolfRole } from "../roles";

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
      const blockedPlayerId = ts?.tavernKeeperBlockedPlayerId;
      const aliveParticipantIds = getGroupPhasePlayerIds(
        game.roleAssignments,
        result.activePhaseKey,
        ts?.deadPlayerIds ?? [],
      ).filter((id) => id !== blockedPlayerId);
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
    const roleDef = getWerewolfRole(result.activePhaseKey);
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

    // Tavern Keeper: on confirm, store the blocked player ID and remove their
    // phase from nightPhaseOrder if they have no other alive teammates.
    if (activePhaseKey === (WerewolfRole.TavernKeeper as string)) {
      const tkAction = phase.nightActions[activePhaseKey];
      if (tkAction && !isTeamNightAction(tkAction) && tkAction.targetPlayerId) {
        const blockedId = tkAction.targetPlayerId;
        ts.tavernKeeperBlockedPlayerId = blockedId;

        const blockedAssignment = game.roleAssignments.find(
          (a) => a.playerId === blockedId,
        );
        if (blockedAssignment) {
          const blockedRole = getWerewolfRole(
            blockedAssignment.roleDefinitionId,
          );
          if (blockedRole) {
            // Determine the phase key the blocked player would act in.
            const blockedPhaseKey = blockedRole.wakesWith ?? blockedRole.id;
            // For a group phase: check if there are other alive participants.
            // If yes, the phase proceeds but blocked player is excluded from
            // consensus. If no (lone team member), remove the phase entirely.
            const isGroupPhase =
              blockedRole.teamTargeting === true ||
              blockedRole.wakesWith !== undefined;
            if (isGroupPhase) {
              const aliveParticipants = getGroupPhasePlayerIds(
                game.roleAssignments,
                blockedPhaseKey as string,
                ts.deadPlayerIds,
              ).filter((id) => id !== blockedId);
              if (aliveParticipants.length === 0) {
                const blockedKey = blockedPhaseKey as string;
                phase.nightPhaseOrder = phase.nightPhaseOrder.filter(
                  (k) => k !== blockedKey && k.split(":")[0] !== blockedKey,
                );
                phase.nightActions = Object.fromEntries(
                  Object.entries(phase.nightActions).filter(
                    ([k]) => k !== blockedKey && k.split(":")[0] !== blockedKey,
                  ),
                );
              }
            } else {
              // Solo role: remove their phase entirely.
              const soloKey = blockedRole.id as string;
              phase.nightPhaseOrder = phase.nightPhaseOrder.filter(
                (k) => k !== soloKey,
              );
              phase.nightActions = Object.fromEntries(
                Object.entries(phase.nightActions).filter(
                  ([k]) => k !== soloKey,
                ),
              );
            }
          }
        }
      }
    }

    // witchAbilityUsed and exposerAbilityUsed are set in start-day
    // during night resolution, so both player and narrator paths are handled.
  },
};
