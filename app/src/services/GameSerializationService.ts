import { GameStatus } from "@/lib/types";
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
} from "@/lib/game-modes/werewolf";
import type {
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

    const result: Partial<PlayerGameState> = {
      myNightTarget: myAction.skipped ? null : myAction.targetPlayerId,
      myNightTargetConfirmed: myAction.confirmed ?? false,
      ...(previousNightTargetId ? { previousNightTargetId } : {}),
      ...(priestWardActive ? { priestWardActive } : {}),
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
      result.investigationResult = {
        targetPlayerId: myAction.targetPlayerId,
        isWerewolfTeam: targetRoleDef?.isWerewolf === true,
      };
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
        const effect = e.attackedBy.includes(SMITE_PHASE_KEY)
          ? "smited"
          : "killed";
        return [{ targetPlayerId: e.targetPlayerId, effect }];
      }
      if (e.type === "tough-guy-absorbed" && e.targetPlayerId === callerId)
        return [{ targetPlayerId: e.targetPlayerId, effect: "survived" }];
      if (e.type === "silenced")
        return [{ targetPlayerId: e.targetPlayerId, effect: "silenced" }];
      if (e.type === "hypnotized")
        return [{ targetPlayerId: e.targetPlayerId, effect: "hypnotized" }];
      return [];
    });

    const result: Partial<PlayerGameState> = {
      ...(nightStatus.length > 0 ? { nightStatus } : {}),
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
