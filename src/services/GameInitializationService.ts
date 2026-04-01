import { ShowRolesInPlay, Team } from "@/lib/types";
import type {
  Game,
  GamePlayer,
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
  VisiblePlayer,
} from "@/lib/types";
import type { RoleInPlay } from "@/server/types";
import { GAME_MODES } from "@/lib/game-modes";

/**
 * Extended role properties used by buildGamePlayers for wake-phase and
 * werewolf-detection visibility. Game modes that don't use these features
 * can pass plain RoleDefinition records — all extended fields are optional.
 */
interface ExtendedRoleProperties {
  teamTargeting?: boolean;
  wakesWith?: string;
  isWerewolf?: boolean;
  awareOf?: { werewolves?: boolean };
}

/**
 * Stateless helpers for assembling game data at creation and start time.
 * Extracted from FirebaseGameService so they can be tested directly.
 */
export class GameInitializationService {
  /**
   * Builds the in-game player list from lobby players and role assignments,
   * computing each player's visible teammates based on role definitions.
   *
   * Accepts any role record that extends RoleDefinition. Game modes with
   * group night phases (e.g. Werewolf) pass role definitions that include
   * teamTargeting, wakesWith, and isWerewolf.
   */
  buildGamePlayers<R extends RoleDefinition<string, Team>>(
    players: LobbyPlayer[],
    roleAssignments: PlayerRoleAssignment[],
    roles: Record<string, R>,
  ): GamePlayer[] {
    const playerById = new Map(players.map((p) => [p.id, p]));

    return roleAssignments.map((assignment) => {
      const player = playerById.get(assignment.playerId);
      if (!player) throw new Error(`Player not found: ${assignment.playerId}`);
      const myRole = roles[assignment.roleDefinitionId] as
        | (R & ExtendedRoleProperties)
        | undefined;

      const visiblePlayers: VisiblePlayer[] = [];
      const seenPlayerIds = new Set<string>();

      // 1. Wake-phase partners: for roles with teamTargeting or wakesWith,
      // find other players who participate in the same group phase.
      if (myRole?.teamTargeting || myRole?.wakesWith) {
        const groupKey =
          myRole.wakesWith ?? (myRole.teamTargeting ? myRole.id : undefined);
        if (groupKey) {
          for (const other of roleAssignments) {
            if (other.playerId === assignment.playerId) continue;
            const otherRole = roles[other.roleDefinitionId] as
              | (R & ExtendedRoleProperties)
              | undefined;
            if (!otherRole) continue;
            const otherGroupKey =
              otherRole.wakesWith ??
              (otherRole.teamTargeting ? otherRole.id : undefined);
            if (otherGroupKey === groupKey || otherRole.id === groupKey) {
              if (!seenPlayerIds.has(other.playerId)) {
                visiblePlayers.push({
                  playerId: other.playerId,
                  reason: "wake-partner",
                });
                seenPlayerIds.add(other.playerId);
              }
            }
          }
        }
      }

      // 2. Aware-of: from awareOf.teams, awareOf.roles, awareOf.werewolves
      if (myRole?.awareOf) {
        const awareOfTeams = new Set(myRole.awareOf.teams ?? []);
        const awareOfRoles = new Set(myRole.awareOf.roles ?? []);
        const awareOfWerewolves = myRole.awareOf.werewolves === true;
        for (const other of roleAssignments) {
          if (other.playerId === assignment.playerId) continue;
          if (seenPlayerIds.has(other.playerId)) continue;
          const otherRole = roles[other.roleDefinitionId] as
            | (R & ExtendedRoleProperties)
            | undefined;
          if (!otherRole) continue;
          if (
            awareOfTeams.has(otherRole.team) ||
            awareOfRoles.has(otherRole.id) ||
            (awareOfWerewolves && otherRole.isWerewolf === true)
          ) {
            visiblePlayers.push({
              playerId: other.playerId,
              reason: "aware-of",
            });
            seenPlayerIds.add(other.playerId);
          }
        }
      }

      return { ...player, visiblePlayers };
    });
  }

  /**
   * Returns the roles visible to players based on the game's showRolesInPlay
   * setting, or undefined if role visibility is disabled.
   */
  buildRolesInPlay(game: Game): RoleInPlay[] | undefined {
    const { roles } = GAME_MODES[game.gameMode];
    const slotMap = new Map(game.configuredRoleSlots.map((s) => [s.roleId, s]));

    switch (game.showRolesInPlay) {
      case ShowRolesInPlay.None:
        return undefined;

      case ShowRolesInPlay.ConfiguredOnly:
        return game.configuredRoleSlots.flatMap((slot) => {
          if (slot.max === 0) return [];
          const role = roles[slot.roleId];
          if (!role) return [];
          return [
            {
              id: role.id,
              name: role.name,
              team: role.team,
              min: slot.min,
              max: slot.max,
            },
          ];
        });

      case ShowRolesInPlay.AssignedRolesOnly: {
        const seen = new Set<string>();
        return game.roleAssignments.flatMap((a) => {
          if (seen.has(a.roleDefinitionId)) return [];
          seen.add(a.roleDefinitionId);
          const role = roles[a.roleDefinitionId];
          const slot = slotMap.get(a.roleDefinitionId);
          if (!role) return [];
          return [
            {
              id: role.id,
              name: role.name,
              team: role.team,
              min: slot?.min ?? 0,
              max: slot?.max ?? 0,
            },
          ];
        });
      }

      case ShowRolesInPlay.RoleAndCount: {
        const counts = new Map<string, number>();
        for (const a of game.roleAssignments) {
          counts.set(
            a.roleDefinitionId,
            (counts.get(a.roleDefinitionId) ?? 0) + 1,
          );
        }
        return [...counts.entries()].flatMap(([roleId, count]) => {
          const role = roles[roleId];
          const slot = slotMap.get(roleId);
          if (!role) return [];
          return [
            {
              id: role.id,
              name: role.name,
              team: role.team,
              min: slot?.min ?? 0,
              max: slot?.max ?? 0,
              count,
            },
          ];
        });
      }
    }
  }
}

export const gameInitializationService = new GameInitializationService();
