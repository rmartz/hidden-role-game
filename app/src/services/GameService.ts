import { randomUUID } from "crypto";
import { GameStatus, GameMode } from "@/lib/models";
import type {
  Game,
  GameModeConfig,
  GamePlayer,
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
  Team,
} from "@/lib/models";
import type {
  RoleSlot,
  PublicRoleInfo,
  PlayerGameState,
} from "@/server/models";
import { GAME_MODES } from "@/lib/game-modes";
import { assignRoles } from "./assignRoles";
import { adjustRoleSlots } from "@/server/role-slots";

export class GameService {
  private games: Record<string, Game> = {};

  public getModeDefinition(gameMode: GameMode): GameModeConfig {
    return GAME_MODES[gameMode];
  }

  private buildGamePlayers(
    players: LobbyPlayer[],
    roleAssignments: PlayerRoleAssignment[],
    roleDefs: Record<string, RoleDefinition<string, Team>>,
  ): GamePlayer[] {
    const playerById = new Map(players.map((p) => [p.id, p]));

    return roleAssignments.map((assignment) => {
      const player = playerById.get(assignment.playerId);
      if (!player) throw new Error(`Player not found: ${assignment.playerId}`);
      const myRoleDef = roleDefs[assignment.roleDefinitionId];

      const visibleRoles: PlayerRoleAssignment[] = [];
      if (myRoleDef?.canSeeTeam && myRoleDef.canSeeTeam.length > 0) {
        const visibleTeams = new Set(myRoleDef.canSeeTeam);
        for (const other of roleAssignments) {
          if (other.playerId === assignment.playerId) continue;
          const roleDef = roleDefs[other.roleDefinitionId];
          if (!roleDef || !visibleTeams.has(roleDef.team)) continue;
          visibleRoles.push(other);
        }
      }

      return { ...player, visibleRoles };
    });
  }

  public createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
    gameMode: GameMode,
    showRolesInPlay: boolean,
  ): Game {
    const { roles } = this.getModeDefinition(gameMode);
    const roleAssignments = assignRoles(players, roleSlots);

    const game: Game = {
      id: randomUUID(),
      lobbyId,
      gameMode,
      status: { type: GameStatus.Playing },
      players: this.buildGamePlayers(players, roleAssignments, roles),
      roleAssignments,
      showRolesInPlay,
    };

    this.games[game.id] = game;
    return game;
  }

  public getGame(gameId: string): Game | undefined {
    return this.games[gameId];
  }

  public adjustRoleSlotsForPlayer(
    current: RoleSlot[],
    gameMode: GameMode,
    numPlayers: number,
    operation: "add" | "remove",
  ): RoleSlot[] {
    const config = this.getModeDefinition(gameMode);
    const target = config.defaultRoleCount(
      Math.max(numPlayers, config.minPlayers),
    );
    return adjustRoleSlots(current, target, operation);
  }

  public getRolesInPlay(game: Game): PublicRoleInfo[] {
    const roleDefs = this.getModeDefinition(game.gameMode).roles;
    return game.roleAssignments.reduce<PublicRoleInfo[]>((acc, assignment) => {
      const def = roleDefs[assignment.roleDefinitionId];
      if (!def || acc.some((r) => r.id === def.id)) return acc;
      return [...acc, { id: def.id, name: def.name, team: def.team }];
    }, []);
  }

  public getPlayerGameState(
    game: Game,
    callerId: string,
  ): PlayerGameState | null {
    const roleDefs = this.getModeDefinition(game.gameMode).roles;

    const caller = game.players.find((p) => p.id === callerId);
    if (!caller) return null;

    const myAssignment = game.roleAssignments.find(
      (r) => r.playerId === callerId,
    );
    if (!myAssignment) return null;

    const myRoleDef = roleDefs[myAssignment.roleDefinitionId];
    if (!myRoleDef) return null;

    const playerById = new Map(game.players.map((p) => [p.id, p]));
    const visibleTeammates = caller.visibleRoles.flatMap((assignment) => {
      const player = playerById.get(assignment.playerId);
      const roleDef = roleDefs[assignment.roleDefinitionId];
      if (!player || !roleDef) return [];
      return [
        {
          player: { id: player.id, name: player.name },
          role: { id: roleDef.id, name: roleDef.name, team: roleDef.team },
        },
      ];
    });

    return {
      status: game.status,
      players: game.players.map((p) => ({ id: p.id, name: p.name })),
      myRole: { id: myRoleDef.id, name: myRoleDef.name, team: myRoleDef.team },
      visibleTeammates,
      rolesInPlay: game.showRolesInPlay ? this.getRolesInPlay(game) : null,
    };
  }
}

declare global {
  var gameServiceInstance: GameService | undefined;
}

export const gameService: GameService =
  globalThis.gameServiceInstance ??
  (globalThis.gameServiceInstance = new GameService());
