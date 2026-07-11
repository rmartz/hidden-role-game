import type { Game, GameAction } from "@/lib/types";

import { GHOST_CLUE_MAX_LENGTH } from "../constants";
import { WerewolfRole } from "../roles";
import { WerewolfPhase } from "../types";
import { currentTurnState } from "../utils";

export const submitGhostClueAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    if (!ts.deadPlayerIds.includes(callerId)) return false;

    const callerAssignment = game.roleAssignments.find(
      (a) => a.playerId === callerId,
    );
    if (callerAssignment?.roleDefinitionId !== (WerewolfRole.Ghost as string))
      return false;

    if (!payload || typeof payload !== "object") return false;
    const { clue } = payload as { clue?: unknown };
    if (typeof clue !== "string") return false;
    const normalized = clue.trim();
    if (normalized.length === 0 || normalized.length > GHOST_CLUE_MAX_LENGTH)
      return false;

    const alreadySubmittedThisTurn = (ts.roleState?.ghost?.clues ?? []).some(
      (c) => c.turn === ts.turn,
    );
    if (alreadySubmittedThisTurn) return false;

    return true;
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (!payload || typeof payload !== "object") return;
    const { clue } = payload as { clue: string };
    const normalized = clue.trim();
    const existingClues = ts.roleState?.ghost?.clues ?? [];
    ts.roleState = {
      ...ts.roleState,
      ghost: { clues: [...existingClues, { turn: ts.turn, clue: normalized }] },
    };
  },
};
