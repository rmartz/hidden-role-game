import type { WerewolfDaytimePhase } from "../types";

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
