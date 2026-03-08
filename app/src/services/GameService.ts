import { randomUUID } from "crypto";
import { GameStatus, GameMode } from "@/lib/models";
import type {
  Game,
  GamePlayer,
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot, PublicRoleInfo } from "@/server/models";
import { secretVillainService } from "./SecretVillainService";
import { avalonService } from "./AvalonService";
import { werewolfService } from "./WerewolfService";

interface GameModeService {
  getRoleDefinitions(): RoleDefinition[];
  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[];
}

export class GameService {
  private games: Record<string, Game> = {};

  private readonly modeServices: Record<GameMode, GameModeService> = {
    [GameMode.SecretVillain]: secretVillainService,
    [GameMode.Avalon]: avalonService,
    [GameMode.Werewolf]: werewolfService,
  };

  private buildGamePlayers(
    players: LobbyPlayer[],
    roleAssignments: PlayerRoleAssignment[],
    roleDefs: RoleDefinition[],
  ): GamePlayer[] {
    const roleDefById = new Map(roleDefs.map((r) => [r.id, r]));
    const playerById = new Map(players.map((p) => [p.id, p]));

    return roleAssignments.map((assignment) => {
      const player = playerById.get(assignment.playerId);
      if (!player) throw new Error(`Player not found: ${assignment.playerId}`);
      const myRoleDef = roleDefById.get(assignment.roleDefinitionId);

      const visibleRoles: PlayerRoleAssignment[] = [];
      if (myRoleDef && myRoleDef.canSeeTeam.length > 0) {
        const visibleTeams = new Set(myRoleDef.canSeeTeam);
        for (const other of roleAssignments) {
          if (other.playerId === assignment.playerId) continue;
          const roleDef = roleDefById.get(other.roleDefinitionId);
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
    const service = this.modeServices[gameMode];
    const roleDefs = service.getRoleDefinitions();
    const roleAssignments = service.createRoleAssignments(players, roleSlots);

    const game: Game = {
      id: randomUUID(),
      lobbyId,
      gameMode,
      status: { type: GameStatus.Playing },
      players: this.buildGamePlayers(players, roleAssignments, roleDefs),
      roleAssignments,
      showRolesInPlay,
    };

    this.games[game.id] = game;
    return game;
  }

  public getGame(gameId: string): Game | undefined {
    return this.games[gameId];
  }

  public getRoleDefinitions(gameMode: GameMode): RoleDefinition[] {
    return this.modeServices[gameMode].getRoleDefinitions();
  }

  public getRolesInPlay(game: Game): PublicRoleInfo[] {
    const roleDefs = this.getRoleDefinitions(game.gameMode);
    const roleDefById = new Map(roleDefs.map((r) => [r.id, r]));
    return game.roleAssignments.reduce<PublicRoleInfo[]>((acc, assignment) => {
      const def = roleDefById.get(assignment.roleDefinitionId);
      if (!def || acc.some((r) => r.id === def.id)) return acc;
      return [...acc, { id: def.id, name: def.name, team: def.team }];
    }, []);
  }
}

declare global {
  var gameServiceInstance: GameService | undefined;
}

export const gameService: GameService =
  globalThis.gameServiceInstance ??
  (globalThis.gameServiceInstance = new GameService());
