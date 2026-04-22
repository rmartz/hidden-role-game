import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { WerewolfRole } from "../roles";
import { currentTurnState } from "../utils";

export const GHOST_CLUE_MAX_LENGTH = 20;

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

    const { clue } = payload as { clue?: unknown };
    if (typeof clue !== "string" || clue.trim().length === 0) return false;
    if (clue.length > GHOST_CLUE_MAX_LENGTH) return false;

    const alreadySubmittedThisTurn = (ts.ghostClues ?? []).some(
      (c) => c.turn === ts.turn,
    );
    if (alreadySubmittedThisTurn) return false;

    return true;
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { clue } = payload as { clue: string };
    ts.ghostClues = [...(ts.ghostClues ?? []), { turn: ts.turn, clue }];
  },
};
