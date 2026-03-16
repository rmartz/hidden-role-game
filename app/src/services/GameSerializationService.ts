import { GameStatus, Team } from "@/lib/types";
import type { Game, RoleDefinition } from "@/lib/types";
import type {
  DaytimeNightStatusEntry,
  NighttimeNightStatusEntry,
  PlayerGameState,
} from "@/server/types";
import {
  isTeamNightAction,
  getTeamPhaseKey,
  getTeamPlayerIds,
  WerewolfPhase,
  TargetCategory,
  getInterimAttackedPlayerIds,
} from "@/lib/game-modes/werewolf";
import type {
  AnyNightAction,
  WerewolfRoleDefinition,
  WerewolfTurnState,
} from "@/lib/game-modes/werewolf";
import { WerewolfRole } from "@/lib/game-modes/werewolf/roles";
import { GAME_MODES } from "@/lib/game-modes";

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
   * For team phases: also returns teamVotes, suggestedTargetId, allAgreed.
   */
  extractPlayerNightState(
    nightActions: Record<string, AnyNightAction>,
    game: Game,
    callerId: string,
    myRole: RoleDefinition,
    deadPlayerIds: string[],
  ): Partial<PlayerGameState> {
    const roleDef = GAME_MODES[game.gameMode].roles[myRole.id] as
      | { teamTargeting?: boolean; team?: string }
      | undefined;

    if (roleDef?.teamTargeting && roleDef.team) {
      const phaseKey = getTeamPhaseKey(roleDef.team as Team);
      const action = nightActions[phaseKey];
      if (!action || !isTeamNightAction(action)) {
        return { myNightTarget: undefined, myNightTargetConfirmed: false };
      }

      const myVote = action.votes.find((v) => v.playerId === callerId);
      const playerById = new Map(game.players.map((p) => [p.id, p]));

      const aliveTeamIds = getTeamPlayerIds(
        game.roleAssignments,
        roleDef.team as Team,
        deadPlayerIds,
      );

      const teamVotes = action.votes
        .filter((v) => aliveTeamIds.includes(v.playerId))
        .map((v) => ({
          playerName: playerById.get(v.playerId)?.name ?? "Unknown",
          targetPlayerId: v.targetPlayerId,
        }));

      const aliveVotes = action.votes.filter((v) =>
        aliveTeamIds.includes(v.playerId),
      );
      const uniqueTargets = new Set(aliveVotes.map((v) => v.targetPlayerId));
      const allAgreed =
        aliveVotes.length === aliveTeamIds.length && uniqueTargets.size === 1;

      return {
        myNightTarget: myVote?.targetPlayerId,
        myNightTargetConfirmed: action.confirmed ?? false,
        teamVotes,
        suggestedTargetId: action.suggestedTargetId,
        allAgreed,
      };
    }

    const myAction = nightActions[myRole.id];
    if (!myAction || isTeamNightAction(myAction)) {
      return { myNightTarget: undefined, myNightTargetConfirmed: false };
    }

    const result: Partial<PlayerGameState> = {
      myNightTarget: myAction.targetPlayerId,
      myNightTargetConfirmed: myAction.confirmed ?? false,
    };

    // For Investigate roles, include the result once the narrator has revealed it.
    const myRoleDef = GAME_MODES[game.gameMode].roles[myRole.id] as
      | WerewolfRoleDefinition
      | undefined;
    if (
      myRoleDef?.targetCategory === TargetCategory.Investigate &&
      myAction.confirmed &&
      myAction.resultRevealed
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
        isWerewolfTeam: targetRoleDef?.team === Team.Bad,
      };
    }

    // For the Witch, include attacked-player info and ability-used state.
    if ((myRole.id as WerewolfRole) === WerewolfRole.Witch) {
      const ts =
        game.status.type === GameStatus.Playing
          ? (game.status.turnState as WerewolfTurnState | undefined)
          : undefined;
      result.witchAbilityUsed = ts?.witchAbilityUsed ?? false;
      if (!ts?.witchAbilityUsed) {
        const attacked = getInterimAttackedPlayerIds(
          nightActions,
          game.roleAssignments,
          deadPlayerIds,
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
    }

    return result;
  }

  /**
   * Extracts sanitized night outcomes and the player's own last action for
   * display at the start of the day. Only populated during daytime phases.
   *
   * nightStatus: killed entries from deaths and silenced entries from the
   * Spellcaster, with attacker/protector info stripped.
   *
   * myLastNightAction: the target the player chose, even if their action was
   * negated, so they can confirm their input was recorded.
   */
  extractDaytimeNightState(
    game: Game,
    callerId: string,
    myRole: RoleDefinition,
  ): Partial<PlayerGameState> {
    if (game.status.type !== GameStatus.Playing) return {};
    const ts = game.status.turnState as WerewolfTurnState | undefined;
    if (ts?.phase.type !== WerewolfPhase.Daytime) return {};
    const phase = ts.phase;

    const nightStatus: DaytimeNightStatusEntry[] = [
      ...(phase.nightResolution ?? [])
        .filter((e) => e.died)
        .map(
          (e): DaytimeNightStatusEntry => ({
            targetPlayerId: e.targetPlayerId,
            effect: "killed",
          }),
        ),
      ...(phase.silencedPlayerIds ?? []).map(
        (id): DaytimeNightStatusEntry => ({
          targetPlayerId: id,
          effect: "silenced",
        }),
      ),
    ];

    const myLastNightAction = this.extractMyLastNightTarget(
      phase.nightActions,
      game,
      callerId,
      myRole,
    );

    return {
      ...(nightStatus.length > 0 ? { nightStatus } : {}),
      ...(myLastNightAction ? { myLastNightAction } : {}),
    };
  }

  /**
   * Returns the target the player chose during the preceding night, or
   * undefined if they took no action.
   */
  extractMyLastNightTarget(
    nightActions: Record<string, AnyNightAction>,
    game: Game,
    callerId: string,
    myRole: RoleDefinition,
  ): { targetPlayerId: string; category: TargetCategory } | undefined {
    const roleDef = GAME_MODES[game.gameMode].roles[myRole.id] as
      | WerewolfRoleDefinition
      | undefined;
    if (!roleDef) return undefined;

    const { targetCategory: category } = roleDef;

    if (roleDef.teamTargeting) {
      const phaseKey = getTeamPhaseKey(roleDef.team);
      const action = nightActions[phaseKey];
      if (!action || !isTeamNightAction(action)) return undefined;
      const myVote = action.votes.find((v) => v.playerId === callerId);
      return myVote
        ? { targetPlayerId: myVote.targetPlayerId, category }
        : undefined;
    }

    const myAction = nightActions[myRole.id];
    if (!myAction || isTeamNightAction(myAction)) return undefined;
    return myAction.targetPlayerId
      ? { targetPlayerId: myAction.targetPlayerId, category }
      : undefined;
  }
}

export const gameSerializationService = new GameSerializationService();
