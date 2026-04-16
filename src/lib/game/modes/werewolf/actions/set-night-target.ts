import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction, TargetCategory } from "../types";
import type { TeamNightAction } from "../types";
import {
  currentTurnState,
  validateActiveNightPlayer,
  isGroupPhaseKey,
  baseGroupPhaseKey,
  getGroupPhasePlayerIds,
  getGroupPhaseMemberIds,
  computeSuggestedTarget,
  isRoleActive,
  getInterimAttackedPlayerIds,
} from "../utils";
import { WerewolfRole, getWerewolfRole } from "../roles";
import { getPlayer } from "@/lib/player";

export const setNightTargetAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    if (ts.turn <= 1) return false;

    const phase = ts.phase;
    const { roleId: explicitPhaseKey, targetPlayerId } = payload as {
      roleId?: unknown;
      targetPlayerId?: unknown;
    };

    // Determine the phase key.
    // Owner provides an explicit roleId/phaseKey; players use their own role.
    let phaseKey: string;
    const isOwner = callerId === game.ownerPlayerId;
    if (isOwner) {
      if (typeof explicitPhaseKey !== "string") return false;
      if (!phase.nightPhaseOrder.includes(explicitPhaseKey)) return false;
      phaseKey = explicitPhaseKey;
    } else {
      const result = validateActiveNightPlayer(game, callerId);
      if (!result) return false;
      phaseKey = result.activePhaseKey;

      // Players cannot change once confirmed.
      const existing = phase.nightActions[phaseKey];
      if (existing?.confirmed) return false;
    }

    // Once-per-game ability restrictions — narrator can bypass these.
    if (!isOwner) {
      if (isRoleActive(phaseKey, WerewolfRole.Witch) && ts.witchAbilityUsed)
        return false;
      if (isRoleActive(phaseKey, WerewolfRole.Exposer) && ts.exposerAbilityUsed)
        return false;
      if (
        isRoleActive(phaseKey, WerewolfRole.Mortician) &&
        ts.morticianAbilityEnded
      )
        return false;
    }

    // targetPlayerId undefined = clear; null = intentional skip; string = set target.
    if (targetPlayerId === undefined) return true;
    if (targetPlayerId === null) return true;
    if (typeof targetPlayerId !== "string") return false;
    if (targetPlayerId === game.ownerPlayerId) return false;
    if (!game.players.some((p) => p.id === targetPlayerId)) return false;
    if (ts.deadPlayerIds.includes(targetPlayerId)) return false;

    // Suffixed repeat group phases (e.g. Wolf Cub bonus attack) cannot pick the
    // same target as the base phase confirmed earlier this same night.
    const baseKey = baseGroupPhaseKey(phaseKey);
    if (baseKey !== phaseKey) {
      const priorAction = phase.nightActions[baseKey];
      if (
        priorAction &&
        isTeamNightAction(priorAction) &&
        priorAction.suggestedTargetId === targetPlayerId
      )
        return false;
    }

    // Roles with preventRepeatTarget cannot target the same player twice in a row.
    const phaseRoleDef = getWerewolfRole(phaseKey);
    if (
      phaseRoleDef?.preventRepeatTarget &&
      ts.lastTargets?.[phaseKey] === targetPlayerId
    )
      return false;

    // One-Eyed Seer cannot target when locked onto a living player.
    if (
      isRoleActive(phaseKey, WerewolfRole.OneEyedSeer) &&
      ts.oneEyedSeerLockedTargetId &&
      !ts.deadPlayerIds.includes(ts.oneEyedSeerLockedTargetId)
    )
      return false;

    // Priest cannot target when they have an active ward on a living player.
    if (isRoleActive(phaseKey, WerewolfRole.Priest) && ts.priestWards) {
      const hasActiveWard = Object.keys(ts.priestWards).some(
        (wardedId) => !ts.deadPlayerIds.includes(wardedId),
      );
      if (hasActiveWard) return false;
    }

    // Attack and Investigate roles cannot target themselves.
    if (targetPlayerId === callerId) {
      const callerAssignment = game.roleAssignments.find(
        (a) => a.playerId === callerId,
      );
      const callerRoleDef = callerAssignment
        ? getWerewolfRole(callerAssignment.roleDefinitionId)
        : undefined;
      if (
        callerRoleDef?.targetCategory === TargetCategory.Attack ||
        callerRoleDef?.targetCategory === TargetCategory.Investigate ||
        callerRoleDef?.preventSelfTarget === true
      )
        return false;
    }

    // Witch cannot self-target unless under attack (self-protect is OK,
    // self-attack is not).
    if (
      isRoleActive(phaseKey, WerewolfRole.Witch) &&
      targetPlayerId === callerId
    ) {
      const attacked = getInterimAttackedPlayerIds(
        phase.nightActions,
        game.roleAssignments,
        ts.deadPlayerIds,
        ts.priestWards,
      );
      if (!attacked.includes(callerId)) return false;
    }

    // Group phases: cannot target players the caller knows are team members.
    if (isGroupPhaseKey(phaseKey) && !isOwner) {
      const caller = getPlayer(game.players, callerId);
      const visibleTeammateIds = (caller?.visiblePlayers ?? []).map(
        (vp) => vp.playerId,
      );
      if (visibleTeammateIds.includes(targetPlayerId)) return false;
    }
    if (isGroupPhaseKey(phaseKey) && isOwner) {
      const memberIds = getGroupPhaseMemberIds(game.roleAssignments, phaseKey);
      if (memberIds.includes(targetPlayerId)) return false;
    }

    return true;
  },
  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return;

    const phase = ts.phase;
    const {
      roleId: explicitPhaseKey,
      targetPlayerId,
      isSecondTarget,
    } = payload as {
      roleId?: string;
      targetPlayerId?: string | null;
      isSecondTarget?: boolean;
    };

    const phaseKey =
      explicitPhaseKey ?? phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!phaseKey) return;

    if (isGroupPhaseKey(phaseKey)) {
      // Group phase: upsert a player's vote.
      const existing = phase.nightActions[phaseKey];
      const groupAction: TeamNightAction =
        existing && isTeamNightAction(existing)
          ? { ...existing, votes: [...existing.votes] }
          : { votes: [] };

      const isOwner = callerId === game.ownerPlayerId;
      if (isOwner) {
        // Owner override: set all alive phase participants' votes.
        const aliveParticipantIds = getGroupPhasePlayerIds(
          game.roleAssignments,
          phaseKey,
          ts.deadPlayerIds,
        );
        if (targetPlayerId === undefined) {
          groupAction.votes = [];
        } else if (targetPlayerId === null) {
          groupAction.votes = aliveParticipantIds.map((pid) => ({
            playerId: pid,
            skipped: true as const,
          }));
        } else {
          groupAction.votes = aliveParticipantIds.map((pid) => ({
            playerId: pid,
            targetPlayerId,
          }));
        }
      } else if (targetPlayerId === undefined) {
        // Remove caller's vote.
        groupAction.votes = groupAction.votes.filter(
          (v) => v.playerId !== callerId,
        );
      } else {
        // Upsert caller's vote (target or intentional skip).
        const existingVote = groupAction.votes.find(
          (v) => v.playerId === callerId,
        );
        if (targetPlayerId === null) {
          if (existingVote) {
            delete existingVote.targetPlayerId;
            existingVote.skipped = true;
          } else {
            groupAction.votes.push({ playerId: callerId, skipped: true });
          }
        } else if (existingVote) {
          existingVote.targetPlayerId = targetPlayerId;
          delete existingVote.skipped;
        } else {
          groupAction.votes.push({ playerId: callerId, targetPlayerId });
        }
      }

      const suggested = computeSuggestedTarget(groupAction.votes);
      if (suggested !== undefined) {
        groupAction.suggestedTargetId = suggested;
      } else {
        delete groupAction.suggestedTargetId;
      }
      phase.nightActions[phaseKey] = groupAction;
    } else {
      // Solo phase.
      if (isSecondTarget) {
        // Mentalist second target: update secondTargetPlayerId on the existing action.
        const existing = phase.nightActions[phaseKey];
        if (existing && !("votes" in existing) && !existing.skipped) {
          if (targetPlayerId === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { secondTargetPlayerId: _, ...rest } = existing;
            phase.nightActions[phaseKey] = rest;
          } else if (typeof targetPlayerId === "string") {
            phase.nightActions[phaseKey] = {
              ...existing,
              secondTargetPlayerId: targetPlayerId,
            };
          }
        }
      } else if (targetPlayerId === undefined) {
        const existing = phase.nightActions[phaseKey];
        if (
          existing &&
          !("votes" in existing) &&
          !existing.skipped &&
          existing.secondTargetPlayerId
        ) {
          // Preserve the second target when only clearing the primary target.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { targetPlayerId: _, ...rest } = existing;
          phase.nightActions[phaseKey] = rest;
        } else {
          // Clear: remove the action entirely (back to undecided state).
          phase.nightActions = Object.fromEntries(
            Object.entries(phase.nightActions).filter(([k]) => k !== phaseKey),
          );
        }
      } else if (targetPlayerId === null) {
        // Intentional skip.
        phase.nightActions[phaseKey] = { skipped: true };
      } else {
        // Preserve secondTargetPlayerId if already set.
        const existing = phase.nightActions[phaseKey];
        const secondTargetPlayerId =
          existing && !("votes" in existing) && !existing.skipped
            ? existing.secondTargetPlayerId
            : undefined;
        phase.nightActions[phaseKey] = {
          targetPlayerId,
          ...(secondTargetPlayerId ? { secondTargetPlayerId } : {}),
        };
      }
    }
  },
};
