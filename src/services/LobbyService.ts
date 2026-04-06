import { randomUUID } from "crypto";
import type {
  Lobby,
  GameMode,
  LobbyConfig,
  ModeConfig,
  RoleSlot,
  RoleConfigMode,
  ShowRolesInPlay,
  TimerConfig,
} from "@/lib/types";
import {
  RoleConfigMode as RoleConfigModeEnum,
  ShowRolesInPlay as ShowRolesInPlayEnum,
} from "@/lib/types";
import { GAME_MODES, getDefaultRoleSlots } from "@/lib/game-modes";
import {
  FirebaseLobbyService,
  lobbyService as firebaseLobbyService,
} from "./FirebaseLobbyService";

export class LobbyService {
  constructor(private readonly firebase: FirebaseLobbyService) {}

  async addLobby(
    owner: { id: string; name: string; sessionId: string },
    gameMode: GameMode,
  ): Promise<Lobby> {
    const lobbyId = randomUUID();
    const config = {
      gameMode,
      roleConfigMode: RoleConfigModeEnum.Default,
      roleSlots: getDefaultRoleSlots(gameMode, 1),
      showConfigToPlayers: false,
      showRolesInPlay: ShowRolesInPlayEnum.ConfiguredOnly,
      timerConfig: GAME_MODES[gameMode].defaultTimerConfig,
      modeConfig: GAME_MODES[gameMode].defaultModeConfig,
    } as LobbyConfig;

    const lobby: Lobby = {
      id: lobbyId,
      ownerSessionId: owner.sessionId,
      players: [owner],
      config,
      readyPlayerIds: [],
    };

    await this.firebase.addLobby(lobby);
    return lobby;
  }

  async getLobby(lobbyId: string): Promise<Lobby | undefined> {
    return this.firebase.getLobby(lobbyId);
  }

  async clearGameId(lobbyId: string): Promise<Lobby | undefined> {
    return this.firebase.clearGameId(lobbyId);
  }

  async setGameId(lobbyId: string, gameId: string): Promise<Lobby | undefined> {
    return this.firebase.setGameId(lobbyId, gameId);
  }

  async transferOwner(
    lobbyId: string,
    targetPlayerId: string,
  ): Promise<Lobby | undefined> {
    return this.firebase.transferOwner(lobbyId, targetPlayerId);
  }

  async removePlayer(
    lobbyId: string,
    playerId: string,
  ): Promise<Lobby | undefined> {
    return this.firebase.removePlayer(lobbyId, playerId);
  }

  async addPlayer(
    lobbyId: string,
    player: { id: string; name: string; sessionId: string },
  ): Promise<Lobby | undefined> {
    return this.firebase.addPlayer(lobbyId, player);
  }

  async toggleReady(
    lobbyId: string,
    playerId: string,
  ): Promise<Lobby | undefined> {
    return this.firebase.toggleReady(lobbyId, playerId);
  }

  async clearReadyPlayerIds(lobbyId: string): Promise<void> {
    return this.firebase.clearReadyPlayerIds(lobbyId);
  }

  async updateConfig(
    lobbyId: string,
    config: {
      showConfigToPlayers?: boolean;
      showRolesInPlay?: ShowRolesInPlay;
      roleConfigMode?: RoleConfigMode;
      gameMode?: GameMode;
      roleSlots?: RoleSlot[];
      timerConfig?: TimerConfig;
      modeConfig?: ModeConfig;
    },
  ): Promise<Lobby | undefined> {
    return this.firebase.updateConfig(lobbyId, config);
  }
}

declare global {
  var lobbyServiceInstance: LobbyService | undefined;
}

export const lobbyService: LobbyService =
  globalThis.lobbyServiceInstance ??
  (globalThis.lobbyServiceInstance = new LobbyService(firebaseLobbyService));
