import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction, TargetCategory } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { getWerewolfRole } from "../roles";

export const revealInvestigationResultAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!activePhaseKey) return false;
    const roleDef = getWerewolfRole(activePhaseKey);

    // Illuminati (revealsFullRoleList): no target confirmation needed — just reveal the role list.
    if (roleDef?.revealsFullRoleList) {
      const action = phase.nightActions[activePhaseKey];
      if (!action) return true;
      if (isTeamNightAction(action)) return false;
      return !action.resultRevealed;
    }

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
    } else if (!action) {
      // Illuminati case: no prior action — create one with resultRevealed.
      const roleDef = getWerewolfRole(activePhaseKey);
      if (roleDef?.revealsFullRoleList) {
        phase.nightActions[activePhaseKey] = { resultRevealed: true };
      }
    }
  },
};
