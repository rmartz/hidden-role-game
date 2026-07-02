import type { Game } from "@/lib/types";
import type { DaytimeNightStatusEntry } from "@/server/types";

import { getWerewolfModeConfig } from "../lobby-config";
import type { WerewolfPlayerGameState } from "../player-state";
import { getWerewolfRole } from "../roles";
import type { AltruistInterceptedNightResolutionEvent } from "../types";
import { WerewolfPhase } from "../types";
import { OLD_MAN_TIMER_KEY, SMITE_PHASE_KEY } from "../utils";
import { currentTurnState } from "../utils/game-state";
import { resolveRevealedPlayerIds } from "./owner-state-helpers";

/**
 * Extracts sanitized night outcomes for the daytime summary.
 * Shared between owner and player views.
 */
export function extractDaytimeNightSummary(
  game: Game,
  callerId: string,
): Partial<WerewolfPlayerGameState> {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== WerewolfPhase.Daytime) return {};
  const phase = ts.phase;
  const revealedPlayerIds = resolveRevealedPlayerIds(game);
  const callerIsOwner = callerId === game.ownerPlayerId;

  const altruistIntercept = (phase.nightResolution ?? []).find(
    (e): e is AltruistInterceptedNightResolutionEvent =>
      e.type === "altruist-intercepted",
  );

  const canSeeOutcomeFor = (playerId: string) =>
    callerIsOwner || revealedPlayerIds.has(playerId) || playerId === callerId;

  const nightStatus: DaytimeNightStatusEntry[] = (
    phase.nightResolution ?? []
  ).flatMap((e): DaytimeNightStatusEntry[] => {
    if (e.type === "killed" && e.died) {
      if (!canSeeOutcomeFor(e.targetPlayerId)) return [];
      // Altruist death: emit altruist-sacrifice with savedPlayerId.
      if (e.targetPlayerId === altruistIntercept?.altruistPlayerId) {
        return [
          {
            targetPlayerId: e.targetPlayerId,
            effect: "altruist-sacrifice",
            savedPlayerId: altruistIntercept.savedPlayerId,
          },
        ];
      }
      if (e.attackedBy.includes(SMITE_PHASE_KEY)) {
        return [{ targetPlayerId: e.targetPlayerId, effect: "smited" }];
      }
      const effect =
        e.attackedBy.length === 1 && e.attackedBy[0] === OLD_MAN_TIMER_KEY
          ? "peaceful"
          : "killed";
      return [{ targetPlayerId: e.targetPlayerId, effect }];
    }
    // Attacked but saved by protection — visible to all when setting is on.
    if (
      e.type === "killed" &&
      !e.died &&
      e.protectedBy.length > 0 &&
      getWerewolfModeConfig(game).revealProtections
    ) {
      return [{ targetPlayerId: e.targetPlayerId, effect: "protected" }];
    }
    if (e.type === "tough-guy-absorbed" && e.targetPlayerId === callerId)
      return [{ targetPlayerId: e.targetPlayerId, effect: "survived" }];
    if (e.type === "silenced" && canSeeOutcomeFor(e.targetPlayerId))
      return [{ targetPlayerId: e.targetPlayerId, effect: "silenced" }];
    if (e.type === "hypnotized" && canSeeOutcomeFor(e.targetPlayerId))
      return [{ targetPlayerId: e.targetPlayerId, effect: "hypnotized" }];
    // Veteran counter-kill: emit when visible and the counter-killed player died.
    if (
      e.type === "veteran-counterkilled" &&
      e.died &&
      canSeeOutcomeFor(e.counterkilledPlayerId)
    ) {
      return [
        {
          targetPlayerId: e.counterkilledPlayerId,
          effect: "veteran-counterkill",
          veteranPlayerId: e.veteranPlayerId,
          veteranCounterkillSource: e.source,
        },
      ];
    }
    return [];
  });
  if (phase.knightedPlayerId !== undefined) {
    nightStatus.push({
      targetPlayerId: phase.knightedPlayerId,
      effect: "knighted",
    });
  }

  // Exposer reveal: emit an "exposed" entry visible to all players. The reveal
  // lives on the daytime phase so it only surfaces on the day after the
  // exposure, not on every subsequent day.
  if (phase.exposerReveal) {
    const exposerReveal = phase.exposerReveal;
    const revealedPlayer = game.players.find(
      (p) => p.id === exposerReveal.playerId,
    );
    const revealedRoleDef = getWerewolfRole(exposerReveal.roleId);
    if (revealedPlayer && revealedRoleDef) {
      nightStatus.push({
        targetPlayerId: exposerReveal.playerId,
        effect: "exposed",
        roleName: revealedRoleDef.name,
      });
    }
  }

  return {
    ...(nightStatus.length > 0 ? { nightStatus } : {}),
  };
}
