import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction, TargetCategory } from "./types";
import type { WerewolfNighttimePhase, TeamNightAction } from "./types";
import {
  buildNightPhaseOrder,
  isOwnerPlaying,
  currentTurnState,
  validateActiveNightPlayer,
  isTeamPhaseKey,
  parseTeamPhaseKey,
  getTeamPlayerIds,
  getTeamMemberPlayerIds,
  computeSuggestedTarget,
  resolveNightActions,
} from "./utils";
import { WEREWOLF_ROLES } from "./roles";
import type { WerewolfRoleDefinition } from "./roles";
import { getPlayer } from "@/lib/player-utils";

export enum WerewolfAction {
  StartNight = "start-night",
  StartDay = "start-day",
  SetNightPhase = "set-night-phase",
  SetNightTarget = "set-night-target",
  ConfirmNightTarget = "confirm-night-target",
  RevealInvestigationResult = "reveal-investigation-result",
  MarkPlayerDead = "mark-player-dead",
  MarkPlayerAlive = "mark-player-alive",
}

export const WEREWOLF_ACTIONS: Record<WerewolfAction, GameAction> = {
  [WerewolfAction.StartNight]: {
    isValid(game: Game, callerId: string) {
      if (!isOwnerPlaying(game, callerId)) return false;
      return currentTurnState(game)?.phase.type === WerewolfPhase.Daytime;
    },
    apply(game: Game) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const nextTurn = ts.turn + 1;
      const nightPhaseOrder = buildNightPhaseOrder(
        nextTurn,
        game.roleAssignments,
        ts.deadPlayerIds,
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
          },
          deadPlayerIds: ts.deadPlayerIds,
        },
      };
    },
  },
  [WerewolfAction.StartDay]: {
    isValid(game: Game, callerId: string) {
      if (!isOwnerPlaying(game, callerId)) return false;
      return currentTurnState(game)?.phase.type === WerewolfPhase.Nighttime;
    },
    apply(game: Game) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const nightPhase = ts.phase as WerewolfNighttimePhase;
      const nightResolution = resolveNightActions(
        nightPhase.nightActions,
        game.roleAssignments,
        ts.deadPlayerIds,
      );
      const newDeadIds = nightResolution
        .filter((e) => e.died)
        .map((e) => e.targetPlayerId);
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          turn: ts.turn,
          phase: {
            type: WerewolfPhase.Daytime,
            startedAt: Date.now(),
            nightActions: nightPhase.nightActions,
            ...(nightResolution.length > 0 ? { nightResolution } : {}),
          },
          deadPlayerIds: [...ts.deadPlayerIds, ...newDeadIds],
        },
      };
    },
  },
  [WerewolfAction.SetNightPhase]: {
    isValid(game: Game, callerId: string, payload: unknown) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
      const { phaseIndex } = payload as { phaseIndex?: unknown };
      return (
        typeof phaseIndex === "number" &&
        phaseIndex >= 0 &&
        phaseIndex < ts.phase.nightPhaseOrder.length
      );
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const { phaseIndex } = payload as { phaseIndex: number };
      const phase = ts.phase as WerewolfNighttimePhase;
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          ...ts,
          phase: {
            ...phase,
            currentPhaseIndex: phaseIndex,
            startedAt: Date.now(),
          },
        },
      };
    },
  },
  [WerewolfAction.SetNightTarget]: {
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

      // For team phases, validate target is not on the same team.
      const team = parseTeamPhaseKey(phaseKey);

      // targetPlayerId undefined = clear; string = set target.
      if (targetPlayerId === undefined) return true;
      if (typeof targetPlayerId !== "string") return false;
      if (targetPlayerId === game.ownerPlayerId) return false;
      if (!game.players.some((p) => p.id === targetPlayerId)) return false;
      if (ts.deadPlayerIds.includes(targetPlayerId)) return false;

      // Attack and Investigate roles cannot target themselves.
      if (targetPlayerId === callerId) {
        const callerAssignment = game.roleAssignments.find(
          (a) => a.playerId === callerId,
        );
        const callerRoleDef = callerAssignment
          ? (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
              callerAssignment.roleDefinitionId
            ]
          : undefined;
        if (
          callerRoleDef?.targetCategory === TargetCategory.Attack ||
          callerRoleDef?.targetCategory === TargetCategory.Investigate
        )
          return false;
      }

      // Team targeting: cannot target players the caller knows are teammates.
      if (team && !isOwner) {
        const caller = getPlayer(game.players, callerId);
        const visibleTeammateIds = (caller?.visibleRoles ?? []).map(
          (vr) => vr.playerId,
        );
        if (visibleTeammateIds.includes(targetPlayerId)) return false;
      }
      if (team && isOwner) {
        const teamMembers = getTeamMemberPlayerIds(game.roleAssignments, team);
        if (teamMembers.includes(targetPlayerId)) return false;
      }

      return true;
    },
    apply(game: Game, payload: unknown, callerId: string) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return;

      const phase = ts.phase;
      const { roleId: explicitPhaseKey, targetPlayerId } = payload as {
        roleId?: string;
        targetPlayerId?: string;
      };

      const phaseKey =
        explicitPhaseKey ?? phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (!phaseKey) return;

      if (isTeamPhaseKey(phaseKey)) {
        // Team phase: upsert a player's vote.
        const existing = phase.nightActions[phaseKey];
        const teamAction: TeamNightAction =
          existing && isTeamNightAction(existing)
            ? { ...existing, votes: [...existing.votes] }
            : { votes: [] };

        const isOwner = callerId === game.ownerPlayerId;
        if (isOwner) {
          // Owner override: set all alive team members' votes.
          const team = parseTeamPhaseKey(phaseKey);
          const aliveTeamIds = team
            ? getTeamPlayerIds(game.roleAssignments, team, ts.deadPlayerIds)
            : [];
          if (targetPlayerId === undefined) {
            teamAction.votes = [];
          } else {
            teamAction.votes = aliveTeamIds.map((pid) => ({
              playerId: pid,
              targetPlayerId,
            }));
          }
        } else if (targetPlayerId === undefined) {
          // Remove caller's vote.
          teamAction.votes = teamAction.votes.filter(
            (v) => v.playerId !== callerId,
          );
        } else {
          // Upsert caller's vote.
          const existingVote = teamAction.votes.find(
            (v) => v.playerId === callerId,
          );
          if (existingVote) {
            existingVote.targetPlayerId = targetPlayerId;
          } else {
            teamAction.votes.push({ playerId: callerId, targetPlayerId });
          }
        }

        const suggested = computeSuggestedTarget(teamAction.votes);
        if (suggested !== undefined) {
          teamAction.suggestedTargetId = suggested;
        } else {
          delete teamAction.suggestedTargetId;
        }
        phase.nightActions[phaseKey] = teamAction;
      } else {
        // Solo phase: existing behavior.
        if (targetPlayerId === undefined) {
          phase.nightActions = Object.fromEntries(
            Object.entries(phase.nightActions).filter(([k]) => k !== phaseKey),
          );
        } else {
          phase.nightActions[phaseKey] = { targetPlayerId };
        }
      }
    },
  },
  [WerewolfAction.ConfirmNightTarget]: {
    isValid(game: Game, callerId: string) {
      const result = validateActiveNightPlayer(game, callerId);
      if (!result) return false;

      const action = result.phase.nightActions[result.activePhaseKey];
      if (!action) return false;
      if (action.confirmed) return false;

      if (result.isTeamPhase) {
        // Team phase: all alive team members must agree on the same target.
        if (!isTeamNightAction(action)) return false;
        const team = parseTeamPhaseKey(result.activePhaseKey);
        if (!team) return false;
        const ts = currentTurnState(game);
        const aliveTeamIds = getTeamPlayerIds(
          game.roleAssignments,
          team,
          ts?.deadPlayerIds ?? [],
        );
        if (aliveTeamIds.length === 0) return false;
        const targets = new Set(
          action.votes
            .filter((v) => aliveTeamIds.includes(v.playerId))
            .map((v) => v.targetPlayerId),
        );
        // All alive members must have voted and all for the same target.
        const voterIds = new Set(
          action.votes
            .filter((v) => aliveTeamIds.includes(v.playerId))
            .map((v) => v.playerId),
        );
        if (voterIds.size !== aliveTeamIds.length) return false;
        if (targets.size !== 1) return false;
        return true;
      }

      // Solo phase: must have a target set.
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
    },
  },
  [WerewolfAction.RevealInvestigationResult]: {
    isValid(game: Game, callerId: string) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
      const phase = ts.phase;
      const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (!activePhaseKey) return false;
      const roleDef = (
        WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>
      )[activePhaseKey];
      if (roleDef?.targetCategory !== TargetCategory.Investigate) return false;
      const action = phase.nightActions[activePhaseKey];
      if (!action || isTeamNightAction(action)) return false;
      if (!action.confirmed) return false;
      return !action.resultRevealed;
    },
    apply(game: Game) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
      const phase = ts.phase;
      const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (!activePhaseKey) return;
      const action = phase.nightActions[activePhaseKey];
      if (action && !isTeamNightAction(action)) {
        phase.nightActions[activePhaseKey] = {
          ...action,
          resultRevealed: true,
        };
      }
    },
  },
  [WerewolfAction.MarkPlayerDead]: {
    isValid(game: Game, callerId: string, payload: unknown) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (!ts) return false;
      const { playerId } = payload as { playerId?: unknown };
      if (typeof playerId !== "string") return false;
      if (playerId === game.ownerPlayerId) return false;
      if (ts.deadPlayerIds.includes(playerId)) return false;
      return game.players.some((p) => p.id === playerId);
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const { playerId } = payload as { playerId: string };
      ts.deadPlayerIds = [...ts.deadPlayerIds, playerId];
    },
  },
  [WerewolfAction.MarkPlayerAlive]: {
    isValid(game: Game, callerId: string, payload: unknown) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (!ts) return false;
      const { playerId } = payload as { playerId?: unknown };
      if (typeof playerId !== "string") return false;
      return ts.deadPlayerIds.includes(playerId);
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (!ts) return;
      const { playerId } = payload as { playerId: string };
      ts.deadPlayerIds = ts.deadPlayerIds.filter((id) => id !== playerId);
    },
  },
};
