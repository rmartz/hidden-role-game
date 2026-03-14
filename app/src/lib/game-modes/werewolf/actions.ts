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
  SubmitNightTarget = "submit-night-target",
  SetNightTarget = "set-night-target",
  ClearNightTarget = "clear-night-target",
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
  [WerewolfAction.SubmitNightTarget]: {
    isValid(game: Game, callerId: string, payload: unknown) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
      if (ts.turn <= 1) return false;

      const phase = ts.phase;
      const callerAssignment = game.roleAssignments.find(
        (a) => a.playerId === callerId,
      );
      if (!callerAssignment) return false;

      const activeRoleId = phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (callerAssignment.roleDefinitionId !== activeRoleId) return false;

      const { targetPlayerId } = payload as { targetPlayerId?: unknown };
      if (typeof targetPlayerId !== "string") return false;
      if (targetPlayerId === callerId) return false;
      return game.players.some((p) => p.id === targetPlayerId);
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
      const { targetPlayerId } = payload as { targetPlayerId: string };
      const phase = ts.phase;
      const activeRoleId = phase.nightPhaseOrder[phase.currentPhaseIndex];
      if (activeRoleId) {
        phase.nightActions[activeRoleId] = { targetPlayerId };
      }
    },
  },
  [WerewolfAction.SetNightTarget]: {
    isValid(game: Game, callerId: string, payload: unknown) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;

      const { roleId, targetPlayerId } = payload as {
        roleId?: unknown;
        targetPlayerId?: unknown;
      };
      if (typeof roleId !== "string" || typeof targetPlayerId !== "string")
        return false;
      if (!ts.phase.nightPhaseOrder.includes(roleId)) return false;
      return game.players.some((p) => p.id === targetPlayerId);
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
      const { roleId, targetPlayerId } = payload as {
        roleId: string;
        targetPlayerId: string;
      };
      ts.phase.nightActions[roleId] = { targetPlayerId };
    },
  },
  [WerewolfAction.ClearNightTarget]: {
    isValid(game: Game, callerId: string, payload: unknown) {
      if (!isOwnerPlaying(game, callerId)) return false;
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;

      const { roleId } = payload as { roleId?: unknown };
      if (typeof roleId !== "string") return false;
      return ts.phase.nightPhaseOrder.includes(roleId);
    },
    apply(game: Game, payload: unknown) {
      const ts = currentTurnState(game);
      if (ts?.phase.type !== WerewolfPhase.Nighttime) return;
      const { roleId } = payload as { roleId: string };
      ts.phase.nightActions = Object.fromEntries(
        Object.entries(ts.phase.nightActions).filter(([id]) => id !== roleId),
      );
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
