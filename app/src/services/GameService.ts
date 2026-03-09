import { randomUUID } from "crypto";
import { GameStatus, GameMode } from "@/lib/models";
import type {
  Game,
  GamePlayer,
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type {
  RoleSlot,
  PublicRoleInfo,
  PlayerGameState,
} from "@/server/models";
import { secretVillainService } from "./SecretVillainService";
import { avalonService } from "./AvalonService";
import { werewolfService } from "./WerewolfService";
import { adjustRoleSlots } from "@/server/role-slots";

interface GameModeService {
  readonly minPlayers: number;
  getRoleDefinitions(): Record<string, RoleDefinition>;
  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[];
  defaultRoleCount(numPlayers: number): RoleSlot[];
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
    roleDefs: Record<string, RoleDefinition>,
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

  public getRoleDefinitions(
    gameMode: GameMode,
  ): Record<string, RoleDefinition> {
    return this.modeServices[gameMode].getRoleDefinitions();
  }

  public defaultRoleCount(gameMode: GameMode, numPlayers: number): RoleSlot[] {
    const service = this.modeServices[gameMode];
    return service.defaultRoleCount(Math.max(numPlayers, service.minPlayers));
  }

  public adjustRoleSlotsForPlayer(
    current: RoleSlot[],
    gameMode: GameMode,
    numPlayers: number,
    operation: "add" | "remove",
  ): RoleSlot[] {
    const target = this.defaultRoleCount(gameMode, numPlayers);
    return adjustRoleSlots(current, target, operation);
  }

  public getRolesInPlay(game: Game): PublicRoleInfo[] {
    const roleDefs = this.getRoleDefinitions(game.gameMode);
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
    const roleDefs = this.getRoleDefinitions(game.gameMode);

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
