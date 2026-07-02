import type { Game } from "@/lib/types";
import type { NighttimeNightStatusEntry } from "@/server/types";

import type { WerewolfPlayerGameState } from "../player-state";
import type { WerewolfRoleDefinition } from "../roles";
import { WerewolfRole } from "../roles";
import type { AnyNightAction, WerewolfTurnState } from "../types";
import { isTeamNightAction } from "../types";
import { getInterimAttackedPlayerIds } from "../utils";

export function extractWitchState(
  game: Game,
  nightActions: Record<string, AnyNightAction>,
  myRole: WerewolfRoleDefinition,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const witchAction = nightActions[myRole.id];
  const soloAction =
    witchAction && !isTeamNightAction(witchAction) ? witchAction : undefined;
  const result: Partial<WerewolfPlayerGameState> = {
    myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
    myNightTargetConfirmed: soloAction?.confirmed ?? false,
    witchAbilityUsed: ts?.roleState?.witch?.abilityUsed ?? false,
  };
  if (!ts?.roleState?.witch?.abilityUsed) {
    const attacked = getInterimAttackedPlayerIds(
      nightActions,
      game.roleAssignments,
      deadPlayerIds,
      ts?.roleState?.priest?.wards,
      ts?.roleState?.mirrorcaster?.charged,
      ts?.roleState?.mercenary?.charged,
      ts?.roleState?.arsonist?.dousedPlayerIds,
    );
    if (attacked.length > 0) {
      result.nightStatus = attacked.map(
        (id): NighttimeNightStatusEntry => ({
          targetPlayerId: id,
          effect: "attacked",
        }),
      );
    }
  }
  return result;
}

export function extractAltruistState(
  game: Game,
  callerId: string,
  nightActions: Record<string, AnyNightAction>,
  myRole: WerewolfRoleDefinition,
  deadPlayerIds: string[],
  ts: WerewolfTurnState | undefined,
): Partial<WerewolfPlayerGameState> {
  const altruistAction = nightActions[myRole.id];
  const soloAction =
    altruistAction && !isTeamNightAction(altruistAction)
      ? altruistAction
      : undefined;
  const witchAction = nightActions[WerewolfRole.Witch] as
    | { targetPlayerId?: string }
    | undefined;
  const witchProtectedId = witchAction?.targetPlayerId;
  const attacked = getInterimAttackedPlayerIds(
    nightActions,
    game.roleAssignments,
    deadPlayerIds,
    ts?.roleState?.priest?.wards,
    ts?.roleState?.mirrorcaster?.charged,
    ts?.roleState?.mercenary?.charged,
    ts?.roleState?.arsonist?.dousedPlayerIds,
  ).filter((id) => id !== callerId && id !== witchProtectedId);
  const result: Partial<WerewolfPlayerGameState> = {
    myNightTarget: soloAction?.skipped ? null : soloAction?.targetPlayerId,
    myNightTargetConfirmed: soloAction?.confirmed ?? false,
  };
  if (attacked.length > 0) {
    result.nightStatus = attacked.map(
      (id): NighttimeNightStatusEntry => ({
        targetPlayerId: id,
        effect: "attacked",
      }),
    );
  }
  return result;
}
