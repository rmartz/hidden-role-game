import type { Game, GameAction } from "@/lib/types";
import type { ActiveTrial, WerewolfTurnState } from "../types";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying, checkWinCondition } from "../utils";
import { WerewolfRole, isWerewolfRole } from "../roles";
import { didWolfCubDie } from "./helpers";

const MAYOR_ROLE_ID: string = WerewolfRole.Mayor;
function isMayor(roleId: string): boolean {
  return roleId === MAYOR_ROLE_ID;
}

export function applyTrialVerdict(
  activeTrial: ActiveTrial,
  ts: WerewolfTurnState,
  game: Game,
) {
  let guiltyCount = activeTrial.votes.filter((v) => v.vote === "guilty").length;
  let innocentCount = activeTrial.votes.filter(
    (v) => v.vote === "innocent",
  ).length;

  // Mayor's vote counts double (secret — extra vote added to their side)
  for (const v of activeTrial.votes) {
    const roleId = game.roleAssignments.find(
      (a) => a.playerId === v.playerId,
    )?.roleDefinitionId;
    if (roleId !== undefined && isWerewolfRole(roleId) && isMayor(roleId)) {
      if (v.vote === "guilty") guiltyCount++;
      else innocentCount++;
    }
  }

  // Strictly more Guilty than Innocent → eliminated; ties/abstentions → innocent
  const eliminated = guiltyCount > innocentCount;
  activeTrial.verdict = eliminated ? "eliminated" : "innocent";

  if (eliminated) {
    const { defendantId } = activeTrial;
    if (!ts.deadPlayerIds.includes(defendantId)) {
      ts.deadPlayerIds = [...ts.deadPlayerIds, defendantId];
      if (didWolfCubDie([defendantId], game)) {
        ts.wolfCubDied = true;
      }
    }
  }
}

export const resolveTrialAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return false;
    if (activeTrial.phase !== "voting") return false;
    return !activeTrial.verdict;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const { activeTrial } = ts.phase;
    if (!activeTrial) return;
    applyTrialVerdict(activeTrial, ts, game);
    const winResult = checkWinCondition(game, ts.deadPlayerIds);
    if (winResult) {
      game.status = winResult;
    }
  },
};
