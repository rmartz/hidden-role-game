import { GameStatus, Team } from "@/lib/types";
import type { Game, RoleDefinition } from "@/lib/types";
import type {
  DaytimeNightStatusEntry,
  NighttimeNightStatusEntry,
  PlayerGameState,
} from "@/server/types";
import {
  isTeamNightAction,
  getGroupPhasePlayerIds,
  WerewolfPhase,
  TargetCategory,
  getInterimAttackedPlayerIds,
  baseGroupPhaseKey,
  isRoleActive,
  getSilencedPlayerIds,
  getHypnotizedPlayerId,
  SMITE_PHASE_KEY,
  OLD_MAN_TIMER_KEY,
} from "@/lib/game-modes/werewolf";
import type {
  AltruistInterceptedNightResolutionEvent,
  AnyNightAction,
  WerewolfRoleDefinition,
  WerewolfTurnState,
} from "@/lib/game-modes/werewolf";
import {
  WerewolfRole,
  WEREWOLF_ROLES,
  isWerewolfRole,
} from "@/lib/game-modes/werewolf/roles";
import { GAME_MODES } from "@/lib/game-modes";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

function hasPriestActiveWard(ts: WerewolfTurnState | undefined): boolean {
  if (!ts?.priestWards) return false;
  return Object.keys(ts.priestWards).some(
    (wardedId) => !ts.deadPlayerIds.includes(wardedId),
  );
}

/**
 * Stateless serialization/sanitization helpers used by FirebaseGameService
 * to build per-player game state. Exposed as public methods so they can be
 * tested directly without constructing a full Firebase game service.
 */
export class GameSerializationService {
  /**
   * Extracts nightActions from the current turnState, if present.
   * Returns undefined when the game is not playing or has no recorded actions.
   */
  extractNightActions(game: Game): Record<string, AnyNightAction> | undefined {
    if (game.status.type !== GameStatus.Playing) return undefined;
    const ts = game.status.turnState as WerewolfTurnState | undefined;
    if (!ts) return undefined;
    const { nightActions } = ts.phase;
    // During nighttime, always return the record (even if empty) so that
    // extractPlayerNightState can read turn-state fields like witchAbilityUsed
    // before any actions have been recorded.
    if (ts.phase.type === WerewolfPhase.Nighttime) return nightActions;
    return Object.keys(nightActions).length > 0 ? nightActions : undefined;
  }

  /** Extracts deadPlayerIds from the Werewolf turn state. */
  extractDeadPlayerIds(game: Game): string[] {
    if (game.status.type !== GameStatus.Playing) return [];
    const ts = game.status.turnState as WerewolfTurnState | undefined;
    return ts?.deadPlayerIds ?? [];
  }

  /** Extracts the Hunter revenge player ID (narrator-only). */
  extractHunterRevengePlayerId(game: Game): string | undefined {
    if (game.status.type !== GameStatus.Playing) return undefined;
    const ts = game.status.turnState as WerewolfTurnState | undefined;
    return ts?.hunterRevengePlayerId;
  }

  /**
   * Extracts the night targeting state for a non-owner player.
   * For solo roles: returns myNightTarget/myNightTargetConfirmed.
   * For group phases (teamTargeting or wakesWith): also returns teamVotes,
   * suggestedTargetId, allAgreed.
   */
  extractPlayerNightState(
    nightActions: Record<string, AnyNightAction>,
    game: Game,
    callerId: string,
    myRole: RoleDefinition,
    deadPlayerIds: string[],
  ): Partial<PlayerGameState> {
    const roleDef = GAME_MODES[game.gameMode].roles[myRole.id] as
      | WerewolfRoleDefinition
      | undefined;

    // Determine if this player participates in a group phase.
    // Primary group phase roles have teamTargeting; secondary roles have wakesWith.
    const groupPhaseKey = roleDef?.teamTargeting
      ? myRole.id
      : roleDef?.wakesWith;

    if (groupPhaseKey) {
      // If the active phase is a suffixed repeat of this group phase
      // (e.g. "werewolf-werewolf:2"), look up the action under that key
      // so the player sees the fresh second-phase state, not the confirmed first.
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      const activePhaseKey =
        ts?.phase.type === WerewolfPhase.Nighttime
          ? ts.phase.nightPhaseOrder[ts.phase.currentPhaseIndex]
          : undefined;
      const lookupKey =
        activePhaseKey && baseGroupPhaseKey(activePhaseKey) === groupPhaseKey
          ? activePhaseKey
          : groupPhaseKey;

      // For a suffixed repeat phase (e.g. "werewolf-werewolf:2"), surface the
      // first phase's suggestedTargetId as previousNightTargetId so the player
      // UI disables that button (within-night exclusion). Computed before the
      // early return so it is set even when no phase-2 action exists yet.
      let previousNightTargetId: string | undefined;
      if (lookupKey !== groupPhaseKey) {
        const baseAction = nightActions[groupPhaseKey];
        if (baseAction && isTeamNightAction(baseAction)) {
          previousNightTargetId = baseAction.suggestedTargetId;
        }
      }

      const action = nightActions[lookupKey];
      if (!action || !isTeamNightAction(action)) {
        return {
          myNightTarget: undefined,
          myNightTargetConfirmed: false,
          ...(previousNightTargetId ? { previousNightTargetId } : {}),
        };
      }

      const myVote = action.votes.find((v) => v.playerId === callerId);
      const playerById = new Map(game.players.map((p) => [p.id, p]));

      const aliveParticipantIds = getGroupPhasePlayerIds(
        game.roleAssignments,
        groupPhaseKey,
        deadPlayerIds,
      );

      const teamVotes = action.votes
        .filter((v) => aliveParticipantIds.includes(v.playerId))
        .map((v) => ({
          playerName: playerById.get(v.playerId)?.name ?? "Unknown",
          ...(v.skipped
            ? { skipped: true as const }
            : { targetPlayerId: v.targetPlayerId }),
        }));

      const aliveVotes = action.votes.filter((v) =>
        aliveParticipantIds.includes(v.playerId),
      );
      const allSkipped = aliveVotes.every((v) => v.skipped === true);
      const uniqueTargets = new Set(
        aliveVotes.filter((v) => !v.skipped).map((v) => v.targetPlayerId),
      );
      const allAgreed =
        aliveVotes.length === aliveParticipantIds.length &&
        (allSkipped || uniqueTargets.size === 1);

      return {
        myNightTarget: myVote?.skipped ? null : myVote?.targetPlayerId,
        myNightTargetConfirmed: action.confirmed ?? false,
        teamVotes,
        suggestedTargetId: action.suggestedTargetId,
        allAgreed,
        ...(previousNightTargetId ? { previousNightTargetId } : {}),
      };
    }

    // For the Exposer, surface ability-used state so the player sees "ability used" message.
    if (isRoleActive(myRole.id, WerewolfRole.Exposer)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      const exposerAction = nightActions[myRole.id];
      const exposerSoloAction =
        exposerAction && !isTeamNightAction(exposerAction)
          ? exposerAction
          : undefined;
      return {
        myNightTarget: exposerSoloAction?.skipped
          ? null
          : exposerSoloAction?.targetPlayerId,
        myNightTargetConfirmed: exposerSoloAction?.confirmed ?? false,
        exposerAbilityUsed: ts?.exposerAbilityUsed ?? false,
      };
    }

    // For the Mortician, surface ability-ended state.
    if (isRoleActive(myRole.id, WerewolfRole.Mortician)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      const morticianAction = nightActions[myRole.id];
      const morticianSoloAction =
        morticianAction && !isTeamNightAction(morticianAction)
          ? morticianAction
          : undefined;
      return {
        myNightTarget: morticianSoloAction?.skipped
          ? null
          : morticianSoloAction?.targetPlayerId,
        myNightTargetConfirmed: morticianSoloAction?.confirmed ?? false,
        morticianAbilityEnded: ts?.morticianAbilityEnded ?? false,
      };
    }

    // For the Witch, include attacked-player info and ability-used state.
    // This must run before the early-return below, since the Witch may not
    // have chosen a target yet but still needs to see who is under attack.
    if (isRoleActive(myRole.id, WerewolfRole.Witch)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      const witchAction = nightActions[myRole.id];
      const witchSoloAction =
        witchAction && !isTeamNightAction(witchAction)
          ? witchAction
          : undefined;
      const result: Partial<PlayerGameState> = {
        myNightTarget: witchSoloAction?.skipped
          ? null
          : witchSoloAction?.targetPlayerId,
        myNightTargetConfirmed: witchSoloAction?.confirmed ?? false,
        witchAbilityUsed: ts?.witchAbilityUsed ?? false,
      };
      if (!ts?.witchAbilityUsed) {
        const attacked = getInterimAttackedPlayerIds(
          nightActions,
          game.roleAssignments,
          deadPlayerIds,
          ts?.priestWards,
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

    // For the Altruist, show players currently under attack (excluding self).
    // They can choose to intercept one attack, sacrificing themselves.
    if (isRoleActive(myRole.id, WerewolfRole.Altruist)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      const altruistAction = nightActions[myRole.id];
      const altruistSoloAction =
        altruistAction && !isTeamNightAction(altruistAction)
          ? altruistAction
          : undefined;
      // The Witch acts before the Altruist; exclude any player the Witch has
      // chosen to protect so the Altruist only sees truly unprotected targets.
      const witchAction = nightActions[WerewolfRole.Witch] as
        | { targetPlayerId?: string }
        | undefined;
      const witchProtectedId = witchAction?.targetPlayerId;
      const attacked = getInterimAttackedPlayerIds(
        nightActions,
        game.roleAssignments,
        deadPlayerIds,
        ts?.priestWards,
      ).filter((id) => id !== callerId && id !== witchProtectedId);
      const result: Partial<PlayerGameState> = {
        myNightTarget: altruistSoloAction?.skipped
          ? null
          : altruistSoloAction?.targetPlayerId,
        myNightTargetConfirmed: altruistSoloAction?.confirmed ?? false,
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

    // Executioner: surface the target player ID so the player knows who to get eliminated.
    if (isRoleActive(myRole.id, WerewolfRole.Executioner)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        ...(ts?.executionerTargetId
          ? { executionerTargetId: ts.executionerTargetId }
          : {}),
      };
    }

    // One-Eyed Seer: if locked onto a living player, surface the lock ID.
    if (isRoleActive(myRole.id, WerewolfRole.OneEyedSeer)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      if (
        ts?.oneEyedSeerLockedTargetId &&
        !ts.deadPlayerIds.includes(ts.oneEyedSeerLockedTargetId)
      ) {
        return {
          myNightTarget: undefined,
          myNightTargetConfirmed: false,
          oneEyedSeerLockedTargetId: ts.oneEyedSeerLockedTargetId,
        };
      }
    }

    // Elusive Seer: on turn 1, surface the list of all Villager player IDs.
    if (isRoleActive(myRole.id, WerewolfRole.ElusiveSeer)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      if (ts?.turn === 1) {
        const elusiveSeerVillagerIds = game.roleAssignments
          .filter(
            (a) => a.roleDefinitionId === (WerewolfRole.Villager as string),
          )
          .map((a) => a.playerId);
        return {
          myNightTarget: undefined,
          myNightTargetConfirmed: false,
          elusiveSeerVillagerIds,
        };
      }
    }

    const myAction = nightActions[myRole.id];
    if (!myAction || isTeamNightAction(myAction)) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      const myRoleDefForRepeat = GAME_MODES[game.gameMode].roles[myRole.id] as
        | WerewolfRoleDefinition
        | undefined;
      const previousNightTargetId = myRoleDefForRepeat?.preventRepeatTarget
        ? ts?.lastTargets?.[myRole.id]
        : undefined;
      const priestWardActive =
        isRoleActive(myRole.id, WerewolfRole.Priest) && hasPriestActiveWard(ts);
      return {
        myNightTarget: undefined,
        myNightTargetConfirmed: false,
        ...(previousNightTargetId ? { previousNightTargetId } : {}),
        ...(priestWardActive ? { priestWardActive } : {}),
      };
    }

    const ts =
      game.status.type === GameStatus.Playing
        ? (game.status.turnState as WerewolfTurnState | undefined)
        : undefined;
    const myRoleDef = GAME_MODES[game.gameMode].roles[myRole.id] as
      | WerewolfRoleDefinition
      | undefined;
    const previousNightTargetId = myRoleDef?.preventRepeatTarget
      ? ts?.lastTargets?.[myRole.id]
      : undefined;
    const priestWardActive =
      isRoleActive(myRole.id, WerewolfRole.Priest) && hasPriestActiveWard(ts);

    const mySecondNightTarget = myAction.secondTargetPlayerId ?? undefined;

    const result: Partial<PlayerGameState> = {
      myNightTarget: myAction.skipped ? null : myAction.targetPlayerId,
      myNightTargetConfirmed: myAction.confirmed ?? false,
      ...(previousNightTargetId ? { previousNightTargetId } : {}),
      ...(priestWardActive ? { priestWardActive } : {}),
      ...(mySecondNightTarget ? { mySecondNightTarget } : {}),
    };

    // For Investigate roles, include the result once the narrator has revealed it.
    if (
      myRoleDef?.targetCategory === TargetCategory.Investigate &&
      myAction.confirmed &&
      myAction.resultRevealed &&
      myAction.targetPlayerId
    ) {
      const targetAssignment = game.roleAssignments.find(
        (a) => a.playerId === myAction.targetPlayerId,
      );
      const targetRoleDef = targetAssignment
        ? (GAME_MODES[game.gameMode].roles[
            targetAssignment.roleDefinitionId
          ] as WerewolfRoleDefinition | undefined)
        : undefined;
      if (myRoleDef.checksForSeer) {
        // Wizard: check whether the target is the Seer.
        const isSeer = targetRoleDef?.id === WerewolfRole.Seer;
        result.investigationResult = {
          targetPlayerId: myAction.targetPlayerId,
          isWerewolfTeam: isSeer,
          resultLabel: isSeer
            ? WEREWOLF_COPY.wizard.isSeer
            : WEREWOLF_COPY.wizard.isNotSeer,
        };
      } else if (myRoleDef.revealsExactRole) {
        // Mystic Seer: reveal the target's exact role name.
        result.investigationResult = {
          targetPlayerId: myAction.targetPlayerId,
          isWerewolfTeam: targetRoleDef?.isWerewolf === true,
          resultLabel: targetRoleDef?.name ?? "Unknown",
        };
      } else if (
        myRoleDef.dualTargetInvestigate &&
        myAction.secondTargetPlayerId
      ) {
        // Mentalist: check whether two targets share the same team.
        const secondAssignment = game.roleAssignments.find(
          (a) => a.playerId === myAction.secondTargetPlayerId,
        );
        const secondRoleDef = secondAssignment
          ? (GAME_MODES[game.gameMode].roles[
              secondAssignment.roleDefinitionId
            ] as WerewolfRoleDefinition | undefined)
          : undefined;
        // Neutral players win individually, so treat them as never sharing a team.
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
        // Seer / One-Eyed Seer: standard isWerewolf check.
        result.investigationResult = {
          targetPlayerId: myAction.targetPlayerId,
          isWerewolfTeam: targetRoleDef?.isWerewolf === true,
        };
      }
    }

    return result;
  }

  /**
   * Extracts sanitized night outcomes and the player's own last action for
   * display at the start of the day. Only populated during daytime phases.
   *
   * nightStatus: killed entries from deaths and silenced entries from the
   * Spellcaster, with attacker/protector info stripped.
   */
  extractDaytimeNightState(
    game: Game,
    callerId: string,
  ): Partial<PlayerGameState> {
    if (game.status.type !== GameStatus.Playing) return {};
    const ts = game.status.turnState as WerewolfTurnState | undefined;
    if (ts?.phase.type !== WerewolfPhase.Daytime) return {};
    const phase = ts.phase;

    const nightStatus: DaytimeNightStatusEntry[] = (
      phase.nightResolution ?? []
    ).flatMap((e): DaytimeNightStatusEntry[] => {
      if (e.type === "killed" && e.died) {
        if (e.attackedBy.includes(SMITE_PHASE_KEY)) {
          return [{ targetPlayerId: e.targetPlayerId, effect: "smited" }];
        }
        // Old Man timer death: attackedBy contains only the timer key.
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
        game.revealProtections
      ) {
        return [{ targetPlayerId: e.targetPlayerId, effect: "protected" }];
      }
      if (e.type === "tough-guy-absorbed" && e.targetPlayerId === callerId)
        return [{ targetPlayerId: e.targetPlayerId, effect: "survived" }];
      if (e.type === "silenced")
        return [{ targetPlayerId: e.targetPlayerId, effect: "silenced" }];
      if (e.type === "hypnotized")
        return [{ targetPlayerId: e.targetPlayerId, effect: "hypnotized" }];
      return [];
    });

    const altruistIntercept = (phase.nightResolution ?? []).find(
      (e): e is AltruistInterceptedNightResolutionEvent =>
        e.type === "altruist-intercepted",
    );

    const result: Partial<PlayerGameState> = {
      ...(nightStatus.length > 0 ? { nightStatus } : {}),
      ...(altruistIntercept
        ? {
            altruistSave: {
              altruistPlayerId: altruistIntercept.altruistPlayerId,
              savedPlayerId: altruistIntercept.savedPlayerId,
            },
          }
        : {}),
    };

    // Include nomination state when nominations are enabled.
    if (game.nominationsEnabled) {
      const nominations = phase.nominations ?? [];
      const nominatorsByDefendant = nominations.reduce<
        Record<string, string[]>
      >((acc, n) => {
        (acc[n.defendantId] ??= []).push(n.nominatorId);
        return acc;
      }, {});
      result.nominations = Object.entries(nominatorsByDefendant).map(
        ([defendantId, nominatorIds]) => ({ defendantId, nominatorIds }),
      );
      const myNomination = nominations.find((n) => n.nominatorId === callerId);
      if (myNomination) {
        result.myNominatedDefendantId = myNomination.defendantId;
      }
    }

    // Executioner: surface the target player ID so the Executioner knows who to get eliminated.
    const callerExecutionerAssignment = game.roleAssignments.find(
      (a) =>
        a.playerId === callerId &&
        a.roleDefinitionId === (WerewolfRole.Executioner as string),
    );
    if (callerExecutionerAssignment && ts.executionerTargetId) {
      result.executionerTargetId = ts.executionerTargetId;
    }

    // Exposer reveal: show the publicly revealed role to all players.
    if (ts.exposerReveal) {
      const exposerReveal = ts.exposerReveal;
      const revealedPlayer = game.players.find(
        (p) => p.id === exposerReveal.playerId,
      );
      const revealedRoleDef =
        GAME_MODES[game.gameMode].roles[exposerReveal.roleId];
      if (revealedPlayer && revealedRoleDef) {
        result.exposerReveal = {
          playerName: revealedPlayer.name,
          roleName: revealedRoleDef.name,
          team: revealedRoleDef.team,
        };
      }
    }

    const silencedIds = getSilencedPlayerIds(ts);
    const callerIsSilenced = silencedIds.includes(callerId);
    const callerIsHypnotized = getHypnotizedPlayerId(ts) === callerId;

    if (callerIsSilenced) {
      result.isSilenced = true;
    }
    if (callerIsHypnotized) {
      result.isHypnotized = true;
    }

    if (phase.activeTrial) {
      const { activeTrial } = phase;
      const alivePlayerCount = game.players.filter(
        (p) =>
          p.id !== game.ownerPlayerId &&
          p.id !== activeTrial.defendantId &&
          !ts.deadPlayerIds.includes(p.id) &&
          !silencedIds.includes(p.id),
      ).length;
      const myVote = activeTrial.votes.find(
        (v) => v.playerId === callerId,
      )?.vote;
      const playerById = new Map(game.players.map((p) => [p.id, p]));

      const callerRoleId = game.roleAssignments.find(
        (a) => a.playerId === callerId,
      )?.roleDefinitionId;
      const mustVoteGuilty =
        callerRoleId !== undefined &&
        isWerewolfRole(callerRoleId) &&
        WEREWOLF_ROLES[callerRoleId].alwaysVotesGuilty === true;
      const mustVoteInnocent =
        callerRoleId !== undefined &&
        isWerewolfRole(callerRoleId) &&
        WEREWOLF_ROLES[callerRoleId].alwaysVotesInnocent === true;

      result.activeTrial = {
        defendantId: activeTrial.defendantId,
        startedAt: activeTrial.startedAt,
        phase: activeTrial.phase,
        ...(activeTrial.voteStartedAt !== undefined
          ? { voteStartedAt: activeTrial.voteStartedAt }
          : {}),
        ...(myVote !== undefined ? { myVote } : {}),
        voteCount: activeTrial.votes.length,
        playerCount: alivePlayerCount,
        ...(activeTrial.verdict ? { verdict: activeTrial.verdict } : {}),
        ...(mustVoteGuilty ? { mustVoteGuilty: true } : {}),
        ...(mustVoteInnocent ? { mustVoteInnocent: true } : {}),
      };

      if (activeTrial.verdict) {
        result.activeTrial.voteResults = activeTrial.votes.map((v) => ({
          playerName: playerById.get(v.playerId)?.name ?? v.playerId,
          vote: v.vote,
        }));

        if (activeTrial.verdict === "eliminated") {
          const assignment = game.roleAssignments.find(
            (a) => a.playerId === activeTrial.defendantId,
          );
          const roleDef = assignment
            ? GAME_MODES[game.gameMode].roles[assignment.roleDefinitionId]
            : undefined;
          if (roleDef) {
            result.activeTrial.eliminatedRole = {
              id: roleDef.id,
              name: roleDef.name,
              team: roleDef.team,
            };
          }
        }
      }
    }

    return result;
  }
}

export const gameSerializationService = new GameSerializationService();
