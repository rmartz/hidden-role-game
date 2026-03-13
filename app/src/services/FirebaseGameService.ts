import { randomUUID } from "crypto";
import { GameStatus, GameMode, ShowRolesInPlay } from "@/lib/types";
import type {
  Game,
  GameModeConfig,
  GamePlayer,
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
  RoleSlot,
  Team,
} from "@/lib/types";
import type {
  RoleInPlay,
  PublicRoleInfo,
  PlayerGameState,
} from "@/server/types";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase, buildNightPhaseOrder } from "@/lib/game-modes/werewolf";
import type {
  WerewolfTurnState,
  WerewolfNighttimePhase,
} from "@/lib/game-modes/werewolf";
import { assignRoles, adjustRoleSlots } from "@/server/utils";
import { getAdminDatabase } from "@/lib/firebase/admin";
import { ServerValue } from "firebase-admin/database";
import {
  gameToFirebase,
  firebaseToGame,
  playerStateToFirebase,
  firebaseToPlayerState,
  type FirebaseGamePublic,
  type FirebasePlayerState,
} from "@/lib/firebase/schema";

function gameRef(gameId: string) {
  return getAdminDatabase().ref(`games/${gameId}`);
}

export class FirebaseGameService {
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
      const visibleTeams = new Set(myRole?.canSeeTeam ?? []);
      const visibleRoleIds = new Set(myRole?.canSeeRole ?? []);
      if (visibleTeams.size > 0 || visibleRoleIds.size > 0) {
        for (const other of roleAssignments) {
          if (other.playerId === assignment.playerId) continue;
          const role = roles[other.roleDefinitionId];
          if (!role) continue;
          if (visibleTeams.has(role.team) || visibleRoleIds.has(role.id)) {
            visibleRoles.push(other);
          }
        }
      }

      return { ...player, visibleRoles };
    });
  }

  private buildInitialTurnState(
    gameMode: GameMode,
    roleAssignments: PlayerRoleAssignment[],
  ): WerewolfTurnState | undefined {
    if (gameMode !== GameMode.Werewolf) return undefined;
    const nightPhaseOrder = buildNightPhaseOrder(1, roleAssignments);
    const phase: WerewolfNighttimePhase = {
      type: WerewolfPhase.Nighttime,
      nightPhaseOrder,
      currentPhaseIndex: 0,
    };
    return { turn: 1, phase };
  }

  private buildRolesInPlay(game: Game): RoleInPlay[] | null {
    const { roles } = this.getModeDefinition(game.gameMode);
    const slotMap = new Map(game.configuredRoleSlots.map((s) => [s.roleId, s]));

    switch (game.showRolesInPlay) {
      case ShowRolesInPlay.None:
        return null;

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
        rolesInPlay: this.buildRolesInPlay(game),
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
          role: {
            id: role.id,
            name: role.name,
            team: role.team,
          } as PublicRoleInfo,
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
      rolesInPlay: this.buildRolesInPlay(game),
    };
  }

  /** Writes pre-computed PlayerGameState for every player in the game. */
  private async writeAllPlayerStates(game: Game): Promise<void> {
    const updates: Record<string, unknown> = {};
    for (const player of game.players) {
      const state = this.getPlayerGameState(game, player.id);
      if (state) {
        updates[`games/${game.id}/playerState/${player.sessionId}`] =
          playerStateToFirebase(state);
      }
    }
    if (Object.keys(updates).length > 0) {
      await getAdminDatabase().ref().update(updates);
    }
  }

  public async createGame(
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
    gameMode: GameMode,
    showRolesInPlay: ShowRolesInPlay,
    ownerPlayerId: string | null,
  ): Promise<Game> {
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
      status: { type: GameStatus.Starting },
      players: gamePlayers,
      roleAssignments,
      configuredRoleSlots: roleSlots,
      showRolesInPlay,
      ownerPlayerId,
    };

    // sessionIndex: { [sessionId]: playerId } — needed to reconstruct Game from Firebase
    const sessionIndex: Record<string, string> = {};
    for (const p of gamePlayers) {
      sessionIndex[p.sessionId] = p.id;
    }

    await gameRef(game.id).set({
      public: { ...gameToFirebase(game), createdAt: ServerValue.TIMESTAMP },
      sessionIndex,
    });
    await this.writeAllPlayerStates(game);

    return game;
  }

  public async getGame(gameId: string): Promise<Game | undefined> {
    const snap = await gameRef(gameId).once("value");
    if (!snap.exists()) return undefined;

    const data = snap.val() as {
      public?: FirebaseGamePublic;
      sessionIndex?: Record<string, string>; // { [sessionId]: playerId }
    };
    if (!data.public) return undefined;

    // Reconstruct GamePlayers with sessionIds using the stored sessionIndex.
    // visibleRoles is omitted — it's only needed at creation time for building playerState.
    const playerIdToSession = new Map(
      Object.entries(data.sessionIndex ?? {}).map(([sid, pid]) => [pid, sid]),
    );

    const players: GamePlayer[] = Object.values(data.public.players).map(
      (p) => ({
        id: p.id,
        name: p.name,
        sessionId: playerIdToSession.get(p.id) ?? "",
        visibleRoles: [],
      }),
    );

    return firebaseToGame(gameId, data.public, players);
  }

  public async getPlayerGameStateBySession(
    gameId: string,
    sessionId: string,
  ): Promise<PlayerGameState | null> {
    const snap = await getAdminDatabase()
      .ref(`games/${gameId}/playerState/${sessionId}`)
      .once("value");
    if (!snap.exists()) return null;
    return firebaseToPlayerState(snap.val() as FirebasePlayerState);
  }

  public async advanceToPlaying(gameId: string): Promise<Game | null> {
    const game = await this.getGame(gameId);
    if (game?.status.type !== GameStatus.Starting) return null;

    game.status = {
      type: GameStatus.Playing,
      turnState: this.buildInitialTurnState(
        game.gameMode,
        game.roleAssignments,
      ),
    };

    await gameRef(gameId)
      .child("public/status")
      .set(JSON.stringify(game.status));
    await this.writeAllPlayerStates(game);

    return game;
  }

  public async applyAction(
    gameId: string,
    actionId: string,
    callerId: string,
    payload: unknown,
  ): Promise<{ game: Game } | { error: string }> {
    const game = await this.getGame(gameId);
    if (!game) return { error: "Game not found" };

    const config = this.getModeDefinition(game.gameMode);
    const action = config.actions[actionId];
    if (!action) return { error: "Unknown action" };

    if (!action.isValid(game, callerId, payload)) {
      return { error: "Action not valid for current game state" };
    }

    action.apply(game, payload);

    await gameRef(gameId)
      .child("public/status")
      .set(JSON.stringify(game.status));
    await this.writeAllPlayerStates(game);

    return { game };
  }

  public adjustRoleSlotsForPlayer(
    current: RoleSlot[],
    gameMode: GameMode,
    numPlayers: number,
    operation: "add" | "remove",
  ): RoleSlot[] {
    const config = this.getModeDefinition(gameMode);
    return adjustRoleSlots(
      current,
      config.defaultRoleCount(numPlayers),
      operation,
    );
  }
}

declare global {
  var firebaseGameServiceInstance: FirebaseGameService | undefined;
}

export const gameService: FirebaseGameService =
  globalThis.firebaseGameServiceInstance ??
  (globalThis.firebaseGameServiceInstance = new FirebaseGameService());
