import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "./types";
import type { WerewolfNighttimePhase } from "./types";
import {
  buildNightPhaseOrder,
  isOwnerPlaying,
  currentTurnState,
} from "./utils";

export enum WerewolfAction {
  StartNight = "start-night",
  StartDay = "start-day",
  SetNightPhase = "set-night-phase",
  SetNightTarget = "set-night-target",
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
      );
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          turn: nextTurn,
          phase: {
            type: WerewolfPhase.Nighttime,
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
      game.status = {
        type: GameStatus.Playing,
        turnState: {
          turn: ts.turn,
          phase: {
            type: WerewolfPhase.Daytime,
            startedAt: Date.now(),
            nightActions: nightPhase.nightActions,
          },
          deadPlayerIds: ts.deadPlayerIds,
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
          phase: { ...phase, currentPhaseIndex: phaseIndex },
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
      const { roleId: explicitRoleId, targetPlayerId } = payload as {
        roleId?: unknown;
        targetPlayerId?: unknown;
      };

      // Determine the role being targeted for.
      // Owner provides an explicit roleId; players use their own role.
      const isOwner = callerId === game.ownerPlayerId;
      if (isOwner) {
        if (typeof explicitRoleId !== "string") return false;
        if (!phase.nightPhaseOrder.includes(explicitRoleId)) return false;
      } else {
        const callerAssignment = game.roleAssignments.find(
          (a) => a.playerId === callerId,
        );
        if (!callerAssignment) return false;
        const activeRoleId = phase.nightPhaseOrder[phase.currentPhaseIndex];
        if (callerAssignment.roleDefinitionId !== activeRoleId) return false;
      }

      // targetPlayerId undefined = clear; string = set target.
      if (targetPlayerId === undefined) return true;
      if (typeof targetPlayerId !== "string") return false;
      if (targetPlayerId === game.ownerPlayerId) return false;
      if (!game.players.some((p) => p.id === targetPlayerId)) return false;
      if (ts.deadPlayerIds.includes(targetPlayerId)) return false;
      return true;
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return;

      const phase = ts.phase;
      const { roleId: explicitRoleId, targetPlayerId } = payload as {
        roleId?: string;
        targetPlayerId?: string;
      };

      // If roleId provided, use it; otherwise use the currently active role.
      const roleId =
        explicitRoleId ?? phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (!roleId) return;

      if (targetPlayerId === undefined) {
        phase.nightActions = Object.fromEntries(
          Object.entries(phase.nightActions).filter(([k]) => k !== roleId),
        );
      } else {
        phase.nightActions[roleId] = { targetPlayerId };
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
