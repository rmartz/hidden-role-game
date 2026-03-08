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
  readonly hasGameOwner: boolean;
  getRoleDefinitions(): RoleDefinition[];
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
    ownerPlayerId: string | null,
  ): Game {
    const service = this.modeServices[gameMode];
    const roleDefs = service.getRoleDefinitions();
    const rolePlayers = ownerPlayerId
      ? players.filter((p) => p.id !== ownerPlayerId)
      : players;
    const roleAssignments = service.createRoleAssignments(
      rolePlayers,
      roleSlots,
    );

    const ownerPlayer = ownerPlayerId
      ? players.find((p) => p.id === ownerPlayerId)
      : null;
    const gamePlayers = [
      ...this.buildGamePlayers(rolePlayers, roleAssignments, roleDefs),
      ...(ownerPlayer ? [{ ...ownerPlayer, visibleRoles: [] }] : []),
    ];

    const game: Game = {
      id: randomUUID(),
      lobbyId,
      gameMode,
      status: { type: GameStatus.Playing },
      players: gamePlayers,
      roleAssignments,
      showRolesInPlay,
      ownerPlayerId,
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

  public defaultRoleCount(gameMode: GameMode, numPlayers: number): RoleSlot[] {
    const service = this.modeServices[gameMode];
    const rolePlayers = numPlayers - (service.hasGameOwner ? 1 : 0);
    return service.defaultRoleCount(Math.max(rolePlayers, service.minPlayers));
  }

  public hasGameOwner(gameMode: GameMode): boolean {
    return this.modeServices[gameMode].hasGameOwner;
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
    const roleDefById = new Map(roleDefs.map((r) => [r.id, r]));
    return game.roleAssignments.reduce<PublicRoleInfo[]>((acc, assignment) => {
      const def = roleDefById.get(assignment.roleDefinitionId);
      if (!def || acc.some((r) => r.id === def.id)) return acc;
      return [...acc, { id: def.id, name: def.name, team: def.team }];
    }, []);
  }

  public getPlayerGameState(
    game: Game,
    callerId: string,
  ): PlayerGameState | null {
    const caller = game.players.find((p) => p.id === callerId);
    if (!caller) return null;

    const roleDefs = this.getRoleDefinitions(game.gameMode);
    const roleDefById = new Map(roleDefs.map((r) => [r.id, r]));
    const playerById = new Map(game.players.map((p) => [p.id, p]));
    const publicPlayers = game.players.map((p) => ({ id: p.id, name: p.name }));

    if (callerId === game.ownerPlayerId) {
      const allRoleAssignments = game.roleAssignments.flatMap((assignment) => {
        const player = playerById.get(assignment.playerId);
        const roleDef = roleDefById.get(assignment.roleDefinitionId);
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
        players: publicPlayers,
        isGameOwner: true,
        myRole: null,
        visibleTeammates: [],
        rolesInPlay: this.getRolesInPlay(game),
        allRoleAssignments,
      };
    }

    const myAssignment = game.roleAssignments.find(
      (r) => r.playerId === callerId,
    );
    if (!myAssignment) return null;

    const myRoleDef = roleDefById.get(myAssignment.roleDefinitionId);
    if (!myRoleDef) return null;

    const visibleTeammates = caller.visibleRoles.flatMap((assignment) => {
      const player = playerById.get(assignment.playerId);
      const roleDef = roleDefById.get(assignment.roleDefinitionId);
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
      players: publicPlayers,
      isGameOwner: false,
      myRole: { id: myRoleDef.id, name: myRoleDef.name, team: myRoleDef.team },
      visibleTeammates,
      rolesInPlay: game.showRolesInPlay ? this.getRolesInPlay(game) : null,
      allRoleAssignments: null,
    };
  }
}

declare global {
  var gameServiceInstance: GameService | undefined;
}

export const gameService: GameService =
  globalThis.gameServiceInstance ??
  (globalThis.gameServiceInstance = new GameService());
