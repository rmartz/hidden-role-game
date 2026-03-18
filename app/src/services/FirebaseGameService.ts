import { randomUUID } from "crypto";
import { GameStatus, GameMode, ShowRolesInPlay } from "@/lib/types";
import type {
  Game,
  GameModeConfig,
  GamePlayer,
  LobbyPlayer,
  RoleSlot,
  VisibilityReason,
} from "@/lib/types";
import type { PlayerGameState, VisibleTeammate } from "@/server/types";
import { GAME_MODES } from "@/lib/game-modes";
import { getPlayer } from "@/lib/player-utils";
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
import { gameSerializationService } from "./GameSerializationService";
import { gameInitializationService } from "./GameInitializationService";

function gameRef(gameId: string) {
  return getAdminDatabase().ref(`games/${gameId}`);
}

export class FirebaseGameService {
  public getModeDefinition(gameMode: GameMode): GameModeConfig {
    return GAME_MODES[gameMode];
  }

  public getPlayerGameState(
    game: Game,
    callerId: string,
  ): PlayerGameState | null {
    const { roles } = this.getModeDefinition(game.gameMode);

    const caller = getPlayer(game.players, callerId);
    if (!caller) return null;

    const playerById = new Map(game.players.map((p) => [p.id, p]));
    const publicPlayers = game.players.map((p) => ({ id: p.id, name: p.name }));

    // Extract nightActions from turnState for the current phase.
    const nightActions = gameSerializationService.extractNightActions(game);

    // Extract deadPlayerIds from Werewolf turn state.
    const deadPlayerIds = gameSerializationService.extractDeadPlayerIds(game);

    if (callerId === game.ownerPlayerId) {
      const visibleRoleAssignments = game.roleAssignments.flatMap(
        (assignment) => {
          const player = playerById.get(assignment.playerId);
          const role = roles[assignment.roleDefinitionId];
          if (!player || !role) return [];
          return [
            {
              player: { id: player.id, name: player.name },
              reason: "revealed" as const,
              role: { id: role.id, name: role.name, team: role.team },
            },
          ];
        },
      );
      const daytimeNightState =
        gameSerializationService.extractDaytimeNightState(game, callerId);
      return {
        status: game.status,
        gameMode: game.gameMode,
        players: publicPlayers,
        gameOwner: { id: caller.id, name: caller.name },
        myPlayerId: undefined,
        myRole: undefined,
        visibleRoleAssignments,
        rolesInPlay: gameInitializationService.buildRolesInPlay(game),
        nominationsEnabled: game.nominationsEnabled,
        ...(nightActions ? { nightActions } : {}),
        ...daytimeNightState,
        ...(deadPlayerIds.length > 0 ? { deadPlayerIds } : {}),
        timerConfig: game.timerConfig,
      };
    }

    const myAssignment = game.roleAssignments.find(
      (r) => r.playerId === callerId,
    );
    if (!myAssignment) return null;

    const myRole = roles[myAssignment.roleDefinitionId];
    if (!myRole) return null;

    // Start with teammate visibility.
    const visibleRoleAssignments: VisibleTeammate[] =
      caller.visiblePlayers.flatMap((vp) => {
        const visiblePlayer = playerById.get(vp.playerId);
        if (!visiblePlayer) return [];
        return [
          {
            player: { id: visiblePlayer.id, name: visiblePlayer.name },
            reason: vp.reason,
            role: undefined,
          },
        ];
      });

    // When game is finished, reveal all roles to every player.
    const isFinished = game.status.type === GameStatus.Finished;
    const revealIds = isFinished
      ? game.roleAssignments.map((a) => a.playerId)
      : deadPlayerIds;

    // Reveal dead players' (or all players', if game over) roles.
    const visiblePlayerIds = new Set(
      visibleRoleAssignments.map((v) => v.player.id),
    );
    for (const revealId of revealIds) {
      if (revealId === callerId || visiblePlayerIds.has(revealId)) continue;
      const revealAssignment = game.roleAssignments.find(
        (a) => a.playerId === revealId,
      );
      if (!revealAssignment) continue;
      const revealPlayer = playerById.get(revealId);
      const revealRole = roles[revealAssignment.roleDefinitionId];
      if (!revealPlayer || !revealRole) continue;
      visibleRoleAssignments.push({
        player: { id: revealPlayer.id, name: revealPlayer.name },
        reason: "revealed",
        role: {
          id: revealRole.id,
          name: revealRole.name,
          team: revealRole.team,
        },
      });
      visiblePlayerIds.add(revealId);
    }

    // Include night targeting state.
    const nightTargetState = nightActions
      ? gameSerializationService.extractPlayerNightState(
          nightActions,
          game,
          callerId,
          myRole,
          deadPlayerIds,
        )
      : {};

    const amDead = deadPlayerIds.includes(callerId);

    // Daytime-only: sanitized night outcomes and personal action confirmation.
    const daytimeNightState = gameSerializationService.extractDaytimeNightState(
      game,
      callerId,
    );

    return {
      status: game.status,
      gameMode: game.gameMode,
      players: publicPlayers,
      gameOwner: game.ownerPlayerId
        ? {
            id: game.ownerPlayerId,
            name:
              playerById.get(game.ownerPlayerId)?.name ?? game.ownerPlayerId,
          }
        : undefined,
      myPlayerId: callerId,
      myRole: { id: myRole.id, name: myRole.name, team: myRole.team },
      visibleRoleAssignments,
      rolesInPlay: gameInitializationService.buildRolesInPlay(game),
      nominationsEnabled: game.nominationsEnabled,
      ...nightTargetState,
      ...daytimeNightState,
      ...(amDead ? { amDead: true } : {}),
      ...(deadPlayerIds.length > 0 ? { deadPlayerIds } : {}),
      timerConfig: game.timerConfig,
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
    ownerPlayerId: string | undefined,
    timerConfig: import("@/lib/types").TimerConfig,
    nominationsEnabled?: boolean,
  ): Promise<Game> {
    const { roles } = this.getModeDefinition(gameMode);
    const rolePlayers = ownerPlayerId
      ? players.filter((p) => p.id !== ownerPlayerId)
      : players;
    const roleAssignments = assignRoles(rolePlayers, roleSlots);

    const ownerPlayer = ownerPlayerId
      ? getPlayer(players, ownerPlayerId)
      : null;
    const gamePlayers: GamePlayer[] = [
      ...gameInitializationService.buildGamePlayers(
        rolePlayers,
        roleAssignments,
        roles,
      ),
      ...(ownerPlayer ? [{ ...ownerPlayer, visiblePlayers: [] }] : []),
    ];

    const game: Game = {
      id: randomUUID(),
      lobbyId,
      gameMode,
      status: { type: GameStatus.Starting, startedAt: Date.now() },
      players: gamePlayers,
      roleAssignments,
      configuredRoleSlots: roleSlots,
      showRolesInPlay,
      ownerPlayerId,
      timerConfig,
      nominationsEnabled: nominationsEnabled ?? false,
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
    // visiblePlayers is omitted — it's only needed at creation time for building playerState.
    const playerIdToSession = new Map(
      Object.entries(data.sessionIndex ?? {}).map(([sid, pid]) => [pid, sid]),
    );

    const players: GamePlayer[] = Object.values(data.public.players).map(
      (p) => ({
        id: p.id,
        name: p.name,
        sessionId: playerIdToSession.get(p.id) ?? "",
        visiblePlayers: (p.visiblePlayers ?? []).map((vp) => ({
          playerId: vp.playerId,
          reason: vp.reason as VisibilityReason,
        })),
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
      turnState: gameInitializationService.buildInitialTurnState(
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
    // Pre-fetch stable game data (players, roleAssignments don't change during play).
    const baseGame = await this.getGame(gameId);
    if (!baseGame) return { error: "Game not found" };

    const config = this.getModeDefinition(baseGame.gameMode);
    const action = config.actions[actionId];
    if (!action) return { error: "Unknown action" };

    // Use a Firebase transaction on `public/status` so concurrent actions are
    // serialized and each sees the latest committed state, preventing lost updates.
    let finalGame: Game | undefined;
    const result = await gameRef(gameId)
      .child("public/status")
      .transaction((currentStatusJson: string | null) => {
        // Firebase may call the callback with null before it has the cached
        // value. Fall back to the pre-fetched status so Firebase can compare
        // and retry with the real server value if it differs.
        const statusJson = currentStatusJson ?? JSON.stringify(baseGame.status);
        const currentStatus = JSON.parse(
          statusJson,
        ) as import("@/lib/types").GameStatusState;
        const game: Game = { ...baseGame, status: currentStatus };
        if (!action.isValid(game, callerId, payload)) return undefined; // abort
        action.apply(game, payload, callerId);
        finalGame = game;
        return JSON.stringify(game.status);
      });

    if (!result.committed || !finalGame) {
      return { error: "Action not valid for current game state" };
    }

    // Use the committed status from the transaction snapshot rather than
    // re-fetching via getGame(). The snapshot is guaranteed to reflect exactly
    // what was written — avoids potential SDK cache staleness and removes the
    // concurrent-write window where a stale writeAllPlayerStates could
    // overwrite a more-recent commit.
    const committedStatusJson = result.snapshot.val() as string | null;
    const committedGame =
      committedStatusJson !== null
        ? ({
            ...baseGame,
            status: JSON.parse(
              committedStatusJson,
            ) as import("@/lib/types").GameStatusState,
          } as Game)
        : finalGame;
    await this.writeAllPlayerStates(committedGame);
    return { game: committedGame };
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
