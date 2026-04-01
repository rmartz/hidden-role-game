import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase, isTeamNightAction, TargetCategory } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WEREWOLF_ROLES } from "../roles";
import type { WerewolfRoleDefinition } from "../roles";

export const revealInvestigationResultAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Nighttime) return false;
    const phase = ts.phase;
    const activePhaseKey = phase.nightPhaseOrder[phase.currentPhaseIndex];
    if (!activePhaseKey) return false;
    const roleDef = (WEREWOLF_ROLES as Record<string, WerewolfRoleDefinition>)[
      activePhaseKey
    ];
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
};
