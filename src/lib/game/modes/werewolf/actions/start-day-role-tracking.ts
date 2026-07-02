import type { Game, PlayerRoleAssignment } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type {
  AnyNightAction,
  NightResolutionEvent,
  ToughGuyAbsorbedNightResolutionEvent,
  WerewolfNighttimePhase,
  WerewolfRoleTurnState,
} from "../types";
import { isTeamNightAction } from "../types";
import { confirmEvilEmpathResultAction } from "./confirm-evil-empath-result";
import { didWolfCubDie } from "./helpers";

/**
 * Extracts the accumulated Tough Guy hit IDs after a night: carries forward
 * prior hits and appends any player who absorbed an attack this night.
 */
export function computeToughGuyHitIds(
  nightResolution: NightResolutionEvent[],
  rs: WerewolfRoleTurnState,
): string[] {
  const newToughGuyHitIds = nightResolution
    .filter(
      (e): e is ToughGuyAbsorbedNightResolutionEvent =>
        e.type === "tough-guy-absorbed",
    )
    .map((e) => e.targetPlayerId);
  return [...(rs.toughGuy?.hitIds ?? []), ...newToughGuyHitIds];
}

/**
 * Extracts the Illusion Artist's confirmed target for this night, if any, to
 * carry into roleState. Seer result resolution reads this to invert the result
 * when the Seer's target matches this player.
 */
export function computeIllusionTargetId(
  nightActions: Record<string, AnyNightAction>,
): string | undefined {
  const illusionRawAction = nightActions[WerewolfRole.IllusionArtist as string];
  const illusionAction =
    illusionRawAction && !isTeamNightAction(illusionRawAction)
      ? illusionRawAction
      : undefined;
  return illusionAction?.confirmed && illusionAction.targetPlayerId
    ? illusionAction.targetPlayerId
    : undefined;
}

/**
 * Ensures the Evil Empath's adjacency result is computed before start-day when
 * the Evil Empath was the final active night phase but the result was never
 * resolved (e.g. narrator advanced directly to start-day). Mutates the game via
 * the same action used in setNightPhaseAction — same guard used there.
 */
export function ensureEvilEmpathResultComputed(
  game: Game,
  nightPhase: WerewolfNighttimePhase,
): void {
  const finalPhaseKey =
    nightPhase.nightPhaseOrder[nightPhase.currentPhaseIndex];
  if (finalPhaseKey !== (WerewolfRole.EvilEmpath as string)) return;

  const finalPhaseAction = nightPhase.nightActions[finalPhaseKey];
  const alreadyComputed =
    finalPhaseAction &&
    !("votes" in finalPhaseAction) &&
    finalPhaseAction.confirmed === true &&
    finalPhaseAction.resultRevealed === true;
  if (!alreadyComputed) {
    confirmEvilEmpathResultAction.apply(game, {}, "");
  }
}

/**
 * Computes the Evil Empath's revealedResult after a night: if the Evil Empath
 * died this night and has a last known result, expose it so Werewolves see it.
 */
export function computeEvilEmpathRevealedResult(
  ts: { roleState?: WerewolfRoleTurnState },
  effectiveAssignments: PlayerRoleAssignment[],
  newDeadIds: string[],
): boolean | undefined {
  const evilEmpathLastResult = ts.roleState?.evilEmpath?.lastResult;
  const evilEmpathAssignment = effectiveAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.EvilEmpath as string),
  );
  return (
    ts.roleState?.evilEmpath?.revealedResult ??
    (evilEmpathAssignment !== undefined &&
    newDeadIds.includes(evilEmpathAssignment.playerId) &&
    evilEmpathLastResult !== undefined
      ? evilEmpathLastResult
      : undefined)
  );
}

/**
 * Whether a once-per-game targeting role (Witch, Exposer) has used its ability:
 * either it was already marked used, or it acted this night with a target.
 */
export function computeOnceTargetAbilityUsed(
  nightActions: Record<string, AnyNightAction>,
  role: WerewolfRole,
  alreadyUsed: boolean,
): boolean {
  const action = nightActions[role as string];
  return (
    alreadyUsed ||
    (action !== undefined &&
      !isTeamNightAction(action) &&
      action.targetPlayerId !== undefined)
  );
}

/**
 * Increments the Veteran's alert usage count if the Veteran alerted this night.
 */
export function computeVeteranAlertsUsed(
  nightActions: Record<string, AnyNightAction>,
  rs: WerewolfRoleTurnState,
): number {
  const veteranNightAction = nightActions[WerewolfRole.Veteran];
  const alertedThisNight =
    veteranNightAction !== undefined &&
    !isTeamNightAction(veteranNightAction) &&
    veteranNightAction.alerted === true;
  return (rs.veteran?.alertsUsed ?? 0) + (alertedThisNight ? 1 : 0);
}

/**
 * Extracts The Thing's tapped player ID for this night, so they see the
 * notification during the following daytime.
 */
export function computeThingTapped(
  nightActions: Record<string, AnyNightAction>,
): string | undefined {
  const thingAction = nightActions[WerewolfRole.TheThing];
  return thingAction !== undefined && !isTeamNightAction(thingAction)
    ? thingAction.targetPlayerId
    : undefined;
}

/**
 * Whether the Wolf Cub has died: either previously recorded, or died this night.
 */
export function computeWolfCubDied(
  newDeadIds: string[],
  game: Game,
  rs: WerewolfRoleTurnState,
): boolean {
  return rs.wolfCub?.died === true || didWolfCubDie(newDeadIds, game);
}
