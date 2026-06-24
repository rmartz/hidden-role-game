import type { Game } from "@/lib/types";
import { Team } from "@/lib/types";

import { WEREWOLF_COPY } from "../copy";
import type { WerewolfPlayerGameState } from "../player-state";
import type { WerewolfRoleDefinition } from "../roles";
import { getWerewolfRole, WerewolfRole } from "../roles";
import type { WerewolfTurnState } from "../types";
import { isTeamNightAction, WerewolfPhase } from "../types";

/**
 * Appends investigation result data to a partial WerewolfPlayerGameState for
 * roles in the Investigate target category. Handles Wizard (checksForSeer),
 * exact-role reveals, dual-target (Mentalist), and standard Seer alignment
 * checks including Illusion Artist inversion.
 */
export function appendInvestigationResult(
  result: Partial<WerewolfPlayerGameState>,
  game: Game,
  myRoleDef: WerewolfRoleDefinition,
  myAction: { targetPlayerId: string; secondTargetPlayerId?: string },
  ts: WerewolfTurnState | undefined,
): void {
  const targetAssignment = game.roleAssignments.find(
    (a) => a.playerId === myAction.targetPlayerId,
  );
  const effectiveTargetRoleId = targetAssignment
    ? (ts?.roleOverrides?.[targetAssignment.playerId] ??
      targetAssignment.roleDefinitionId)
    : undefined;
  const targetRoleDef = effectiveTargetRoleId
    ? getWerewolfRole(effectiveTargetRoleId)
    : undefined;

  if (myRoleDef.checksForSeer) {
    const isSeer = targetRoleDef?.id === WerewolfRole.Seer;
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: isSeer,
      resultLabel: isSeer
        ? WEREWOLF_COPY.wizard.isSeer
        : WEREWOLF_COPY.wizard.isNotSeer,
    };
  } else if (myRoleDef.revealsExactRole) {
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: targetRoleDef?.isWerewolf === true,
      resultLabel: targetRoleDef?.name ?? "Unknown",
    };
  } else if (myRoleDef.dualTargetInvestigate && myAction.secondTargetPlayerId) {
    const secondAssignment = game.roleAssignments.find(
      (a) => a.playerId === myAction.secondTargetPlayerId,
    );
    const effectiveSecondRoleId = secondAssignment
      ? (ts?.roleOverrides?.[secondAssignment.playerId] ??
        secondAssignment.roleDefinitionId)
      : undefined;
    const secondRoleDef = effectiveSecondRoleId
      ? getWerewolfRole(effectiveSecondRoleId)
      : undefined;
    const sameTeam =
      targetRoleDef?.team !== Team.Neutral &&
      secondRoleDef?.team !== Team.Neutral &&
      targetRoleDef?.team === secondRoleDef?.team;
    const playerById = new Map(game.players.map((p) => [p.id, p]));
    const secondName =
      playerById.get(myAction.secondTargetPlayerId)?.name ??
      myAction.secondTargetPlayerId;
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: sameTeam,
      resultLabel: sameTeam
        ? WEREWOLF_COPY.mentalist.sameTeam
        : WEREWOLF_COPY.mentalist.differentTeams,
      secondTargetName: secondName,
    };
  } else {
    const isWerewolf = targetRoleDef?.isWerewolf === true;
    // Illusion Artist inversion only applies to Seer investigations. Other
    // investigate roles (One-Eyed Seer, etc.) always see the true alignment.
    let effectiveIsWerewolf = isWerewolf;
    if (myRoleDef.id === WerewolfRole.Seer) {
      // During nighttime, roleState.illusionArtist is not yet set
      // (that happens at start-day), so derive the illusion target from the
      // confirmed IllusionArtist night action instead.
      let illusionTargetId: string | undefined;
      if (ts?.phase.type === WerewolfPhase.Nighttime) {
        const illusionAction =
          ts.phase.nightActions[WerewolfRole.IllusionArtist as string];
        if (
          illusionAction &&
          !isTeamNightAction(illusionAction) &&
          illusionAction.confirmed
        ) {
          illusionTargetId = illusionAction.targetPlayerId;
        }
      } else {
        illusionTargetId = ts?.roleState?.illusionArtist?.illusionTargetId;
      }
      if (illusionTargetId === myAction.targetPlayerId) {
        effectiveIsWerewolf = !isWerewolf;
      }
    }
    result.investigationResult = {
      targetPlayerId: myAction.targetPlayerId,
      isWerewolfTeam: effectiveIsWerewolf,
      resultLabel:
        WEREWOLF_COPY.narrator.seerAlignmentStatus(effectiveIsWerewolf),
    };
  }
}
