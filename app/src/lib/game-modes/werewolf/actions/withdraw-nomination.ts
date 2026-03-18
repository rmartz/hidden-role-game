import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import { currentTurnState } from "../utils";

export const withdrawNominationAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (callerId === game.ownerPlayerId) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== WerewolfPhase.Daytime) return false;
    // Cannot withdraw while a trial is active and unresolved
    if (ts.phase.activeTrial && !ts.phase.activeTrial.verdict) return false;
    return (ts.phase.nominations ?? []).some((n) => n.nominatorId === callerId);
  },
  apply(game: Game, _payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    ts.phase.nominations = (ts.phase.nominations ?? []).filter(
      (n) => n.nominatorId !== callerId,
    );
  },
};
