import { GameStatus, ShowRolesInPlay } from "@/lib/types";
import type {
  Game,
  GameModeConfig,
  GamePlayer,
  LobbyPlayer,
  ModeConfig,
  PlayingGameStatus,
  RoleSlot,
  TimerConfig,
} from "@/lib/types";
import type { PlayerGameState, VisibleTeammate } from "@/server/types";
import { GAME_MODES } from "@/lib/game-modes";
import { getPlayer } from "@/lib/player-utils";
import { assignRoles, adjustRoleSlots } from "@/server/utils";
import { gameInitializationService } from "./GameInitializationService";
import { GameMode } from "@/lib/types";

/**
 * Pure business logic for game state — no Firebase or data access.
 * Builds PlayerGameState from Game objects, handles role assignment,
 * and delegates to GameModeServices for mode-specific state.
 */
export class GameStateService {
  public getModeDefinition(gameMode: GameMode): GameModeConfig {
    return GAME_MODES[gameMode];
  }

  /**
   * Build the PlayerGameState visible to a specific player (or the owner).
   * Pure computation — no side effects or data access.
   */
  public getPlayerGameState(
    game: Game,
    callerId: string,
  ): PlayerGameState | null {
    const config = this.getModeDefinition(game.gameMode);
    const { roles, services } = config;

    const caller = getPlayer(game.players, callerId);
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
              reason: "revealed" as const,
              role: { id: role.id, name: role.name, team: role.team },
            },
          ];
        },
      );
      const modeState = services.extractPlayerState(game, callerId, undefined);
      return {
        status: game.status,
        gameMode: game.gameMode,
        lobbyId: game.lobbyId,
        players: publicPlayers,
        gameOwner: { id: caller.id, name: caller.name },
        myPlayerId: undefined,
        myRole: undefined,
        visibleRoleAssignments,
        rolesInPlay: gameInitializationService.buildRolesInPlay(game),
        timerConfig: game.timerConfig,
        ...modeState,
      } as PlayerGameState;
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
        const visibleRole = vp.roleId ? roles[vp.roleId] : undefined;
        return [
          {
            player: { id: visiblePlayer.id, name: visiblePlayer.name },
            reason: vp.reason,
            ...(visibleRole
              ? {
                  role: {
                    id: visibleRole.id,
                    name: visibleRole.name,
                    team: visibleRole.team,
                  },
                }
              : {}),
          },
        ];
      });

    // When game is finished, reveal all roles to every player.
    // For dead player reveals during play, the mode services include
    // deadPlayerIds — use those for role reveals.
    const modeState = services.extractPlayerState(game, callerId, myRole);
    const deadPlayerIds =
      (modeState["deadPlayerIds"] as string[] | undefined) ?? [];
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

    // Mode-specific additional visibility (e.g. Executioner target).
    const { modeVisiblePlayerIds: modeVisibleRaw, ...modeStateClean } =
      modeState;
    const modeVisiblePlayerIds = (modeVisibleRaw as string[] | undefined) ?? [];
    for (const pid of modeVisiblePlayerIds) {
      if (pid === callerId || visiblePlayerIds.has(pid)) continue;
      const visiblePlayer = playerById.get(pid);
      if (visiblePlayer) {
        visibleRoleAssignments.push({
          player: { id: visiblePlayer.id, name: visiblePlayer.name },
          reason: "aware-of",
        });
        visiblePlayerIds.add(pid);
      }
    }

    return {
      status: game.status,
      gameMode: game.gameMode,
      lobbyId: game.lobbyId,
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
      timerConfig: game.timerConfig,
      ...modeStateClean,
    } as PlayerGameState;
  }

  /**
   * Build all per-player game states for a game. Pure computation.
   */
  public buildAllPlayerStates(game: Game): Map<string, PlayerGameState> {
    const states = new Map<string, PlayerGameState>();
    for (const player of game.players) {
      const state = this.getPlayerGameState(game, player.id);
      if (state) states.set(player.sessionId, state);
    }
    return states;
  }

  /**
   * Build a Game object from lobby data (role assignment, player setup).
   * Returns the game object ready for persistence — no Firebase calls.
   */
  public buildGame(
    gameId: string,
    lobbyId: string,
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
    gameMode: GameMode,
    showRolesInPlay: ShowRolesInPlay,
    ownerPlayerId: string | undefined,
    timerConfig: TimerConfig,
    /** Game-mode-specific config (e.g., nominationsEnabled for Werewolf). */
    modeConfig?: ModeConfig,
  ): Game {
    const config = this.getModeDefinition(gameMode);
    const { roles, services } = config;

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

    const specialTargets = services.selectSpecialTargets(roleAssignments);

    // Cast required: Game is a discriminated union keyed on gameMode, but
    // gameMode is a runtime parameter so TS cannot narrow the union statically.
    return {
      id: gameId,
      lobbyId,
      gameMode,
      status: { type: GameStatus.Starting, startedAt: Date.now() },
      players: gamePlayers,
      roleAssignments,
      configuredRoleSlots: roleSlots,
      showRolesInPlay,
      ownerPlayerId,
      timerConfig,
      modeConfig: modeConfig ?? config.defaultModeConfig,
      ...specialTargets,
    } as Game;
  }

  /**
   * Build the initial turn state for transitioning from Starting → Playing.
   */
  public buildPlayingStatus(game: Game): PlayingGameStatus {
    const { services } = this.getModeDefinition(game.gameMode);
    return {
      type: GameStatus.Playing,
      turnState: services.buildInitialTurnState(game.roleAssignments, {
        ...game.modeConfig,
        executionerTargetId: game.executionerTargetId,
      }),
    };
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

export const gameStateService = new GameStateService();
