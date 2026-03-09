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
    roles: Record<string, RoleDefinition<string, Team>>,
  ): GamePlayer[] {
    const playerById = new Map(players.map((p) => [p.id, p]));

    return roleAssignments.map((assignment) => {
      const player = playerById.get(assignment.playerId);
      if (!player) throw new Error(`Player not found: ${assignment.playerId}`);
      const myRole = roles[assignment.roleDefinitionId];

      const visibleRoles: PlayerRoleAssignment[] = [];
      if (myRole?.canSeeTeam && myRole.canSeeTeam.length > 0) {
        const visibleTeams = new Set(myRole.canSeeTeam);
        for (const other of roleAssignments) {
          if (other.playerId === assignment.playerId) continue;
          const role = roles[other.roleDefinitionId];
          if (!role || !visibleTeams.has(role.team)) continue;
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
    const { roles } = this.getModeDefinition(gameMode);
    const rolePlayers = ownerPlayerId
      ? players.filter((p) => p.id !== ownerPlayerId)
      : players;
    const roleAssignments = assignRoles(rolePlayers, roleSlots);

    const ownerPlayer = ownerPlayerId
      ? players.find((p) => p.id === ownerPlayerId)
      : null;
    const gamePlayers: GamePlayer[] = [
      ...this.buildGamePlayers(rolePlayers, roleAssignments, roles),
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

  public adjustRoleSlotsForPlayer(
    current: RoleSlot[],
    gameMode: GameMode,
    numPlayers: number,
    operation: "add" | "remove",
  ): RoleSlot[] {
    const config = this.getModeDefinition(gameMode);
    const rolePlayers = numPlayers - (config.ownerTitle ? 1 : 0);
    return adjustRoleSlots(
      current,
      config.defaultRoleCount(rolePlayers),
      operation,
    );
  }

  public getRolesInPlay(game: Game): PublicRoleInfo[] {
    const { roles } = this.getModeDefinition(game.gameMode);
    return game.roleAssignments.reduce<PublicRoleInfo[]>((acc, assignment) => {
      const role = roles[assignment.roleDefinitionId];
      if (!role || acc.some((r) => r.id === role.id)) return acc;
      return [...acc, { id: role.id, name: role.name, team: role.team }];
    }, []);
  }

  public getPlayerGameState(
    game: Game,
    callerId: string,
  ): PlayerGameState | null {
    const { roles } = this.getModeDefinition(game.gameMode);

    const caller = game.players.find((p) => p.id === callerId);
    if (!caller) return null;

    const playerById = new Map(game.players.map((p) => [p.id, p]));
    const publicPlayers = game.players.map((p) => ({ id: p.id, name: p.name }));

    if (callerId === game.ownerPlayerId) {
      const visibleRoleAssignments = game.roleAssignments.flatMap(
        (assignment) => {
          const player = playerById.get(assignment.playerId);
          const role = roles[assignment.roleDefinitionId];
          if (!player || !role) return [];
          return [
            {
              player: { id: player.id, name: player.name },
              role: { id: role.id, name: role.name, team: role.team },
            },
          ];
        },
      );
      return {
        status: game.status,
        gameMode: game.gameMode,
        players: publicPlayers,
        gameOwner: { id: caller.id, name: caller.name },
        myRole: null,
        visibleRoleAssignments,
        rolesInPlay: this.getRolesInPlay(game),
      };
    }

    const myAssignment = game.roleAssignments.find(
      (r) => r.playerId === callerId,
    );
    if (!myAssignment) return null;

    const myRole = roles[myAssignment.roleDefinitionId];
    if (!myRole) return null;

    const visibleRoleAssignments = caller.visibleRoles.flatMap((assignment) => {
      const player = playerById.get(assignment.playerId);
      const role = roles[assignment.roleDefinitionId];
      if (!player || !role) return [];
      return [
        {
          player: { id: player.id, name: player.name },
          role: { id: role.id, name: role.name, team: role.team },
        },
      ];
    });

    return {
      status: game.status,
      gameMode: game.gameMode,
      players: publicPlayers,
      gameOwner: null,
      myRole: { id: myRole.id, name: myRole.name, team: myRole.team },
      visibleRoleAssignments,
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
