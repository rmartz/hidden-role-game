import type { NightResolutionEvent, WerewolfDaytimePhase } from "../types";

export enum NightOutcomeEffect {
  Killed = "killed",
  Silenced = "silenced",
  Hypnotized = "hypnotized",
}

export interface AffectedPlayerOutcome {
  playerId: string;
  effect: NightOutcomeEffect;
}

/**
 * Returns each affected player and their primary announced effect, in
 * nightResolution order. A player appears at most once, with the first
 * encountered effect (killed takes natural priority since it precedes status
 * effects in the resolution list).
 */
export function getOrderedAffectedPlayers(
  nightResolution: NightResolutionEvent[],
): AffectedPlayerOutcome[] {
  const seen = new Set<string>();
  const result: AffectedPlayerOutcome[] = [];
  for (const event of nightResolution) {
    let outcome: AffectedPlayerOutcome | undefined;
    if (event.type === "killed" && event.died) {
      outcome = {
        playerId: event.targetPlayerId,
        effect: NightOutcomeEffect.Killed,
      };
    } else if (event.type === "silenced") {
      outcome = {
        playerId: event.targetPlayerId,
        effect: NightOutcomeEffect.Silenced,
      };
    } else if (event.type === "hypnotized") {
      outcome = {
        playerId: event.targetPlayerId,
        effect: NightOutcomeEffect.Hypnotized,
      };
    }
    if (outcome && !seen.has(outcome.playerId)) {
      seen.add(outcome.playerId);
      result.push(outcome);
    }
  }
  return result;
}

/** Returns ordered player IDs of all publicly announceable night outcomes. */
export function getOrderedAffectedPlayerIds(
  nightResolution: NightResolutionEvent[],
): string[] {
  return getOrderedAffectedPlayers(nightResolution).map((p) => p.playerId);
}

/** True when at least one player died during the previous night. */
export function hasKilledOutcome(phase: WerewolfDaytimePhase): boolean {
  return (phase.nightResolution ?? []).some(
    (event) => event.type === "killed" && event.died,
  );
}

/** True when at least one player was silenced or hypnotized during the night. */
export function hasStatusOutcome(phase: WerewolfDaytimePhase): boolean {
  return (phase.nightResolution ?? []).some(
    (event) => event.type === "silenced" || event.type === "hypnotized",
  );
}
