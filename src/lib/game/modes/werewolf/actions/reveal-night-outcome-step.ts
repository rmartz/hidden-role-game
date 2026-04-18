import type { Game, GameAction } from "@/lib/types";
import { getOrderedAffectedPlayerIds } from "../services";
import { WerewolfPhase } from "../types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { getWerewolfModeConfig } from "../lobby-config";

export const revealNightOutcomeStepAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    void payload;
    if (!isOwnerPlaying(game, callerId)) return false;
    if (getWerewolfModeConfig(game).autoRevealNightOutcome) return false;
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return false;
    const phase = ts.phase;
    const affectedIds = getOrderedAffectedPlayerIds(
      phase.nightResolution ?? [],
    );
    if (affectedIds.length === 0) return false;
    const revealed = new Set(phase.revealedPlayerIds ?? []);
    return affectedIds.some((id) => !revealed.has(id));
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== WerewolfPhase.Daytime) return;
    const phase = ts.phase;
    const affectedIds = getOrderedAffectedPlayerIds(
      phase.nightResolution ?? [],
    );
    const revealed = new Set(phase.revealedPlayerIds ?? []);
    const nextId = affectedIds.find((id) => !revealed.has(id));
    if (nextId) {
      phase.revealedPlayerIds = [...(phase.revealedPlayerIds ?? []), nextId];
    }
  },
};
