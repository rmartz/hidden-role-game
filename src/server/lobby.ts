import { randomUUID } from "crypto";
import type { GameMode, Lobby, LobbyConfig } from "@/lib/types";
import {
  GameMode as GameModeEnum,
  RoleConfigMode as RoleConfigModeEnum,
  ShowRolesInPlay as ShowRolesInPlayEnum,
} from "@/lib/types";
import type { WerewolfLobbyConfig } from "@/lib/game/modes/werewolf/lobby-config";
import { DEFAULT_WEREWOLF_MODE_CONFIG } from "@/lib/game/modes/werewolf/lobby-config";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import type { SecretVillainLobbyConfig } from "@/lib/game/modes/secret-villain/lobby-config";
import { DEFAULT_SECRET_VILLAIN_MODE_CONFIG } from "@/lib/game/modes/secret-villain/lobby-config";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import type { AvalonLobbyConfig } from "@/lib/game/modes/avalon/lobby-config";
import { DEFAULT_AVALON_MODE_CONFIG } from "@/lib/game/modes/avalon/lobby-config";
import { DEFAULT_TIMER_CONFIG } from "@/lib/types";
import { getDefaultRoleSlots } from "@/lib/game/modes";
import {
  addLobby as firebaseAddLobby,
  getLobby,
  addPlayer,
  removePlayer,
  transferOwner,
  toggleReady,
  updateConfig,
  clearGameId,
  clearReadyPlayerIds,
  setLobbyGameId,
} from "@/services/lobby";

export {
  getLobby,
  addPlayer,
  removePlayer,
  transferOwner,
  toggleReady,
  updateConfig,
  clearGameId,
};

/**
 * Marks a lobby as having an active game: clears ready player IDs and records
 * the new game ID in one parallel write. Returns the updated lobby, or
 * undefined if the lobby does not exist.
 */
export async function startLobbyGame(
  lobbyId: string,
  gameId: string,
): Promise<Lobby | undefined> {
  const [, updated] = await Promise.all([
    clearReadyPlayerIds(lobbyId),
    setLobbyGameId(lobbyId, gameId),
  ]);
  return updated;
}

function buildDefaultLobbyConfig(gameMode: GameMode): LobbyConfig {
  const base = {
    roleConfigMode: RoleConfigModeEnum.Default,
    roleSlots: getDefaultRoleSlots(gameMode, 1),
    showConfigToPlayers: false,
    showRolesInPlay: ShowRolesInPlayEnum.ConfiguredOnly,
  };
  switch (gameMode) {
    case GameModeEnum.Werewolf:
      return {
        ...base,
        gameMode,
        timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
        modeConfig: DEFAULT_WEREWOLF_MODE_CONFIG,
      } satisfies WerewolfLobbyConfig;
    case GameModeEnum.SecretVillain:
      return {
        ...base,
        gameMode,
        timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
        modeConfig: DEFAULT_SECRET_VILLAIN_MODE_CONFIG,
      } satisfies SecretVillainLobbyConfig;
    case GameModeEnum.Avalon:
      return {
        ...base,
        gameMode,
        timerConfig: DEFAULT_TIMER_CONFIG,
        modeConfig: DEFAULT_AVALON_MODE_CONFIG,
      } satisfies AvalonLobbyConfig;
  }
}

export async function addLobby(
  owner: { id: string; name: string; sessionId: string },
  gameMode: GameMode,
): Promise<Lobby> {
  const lobbyId = randomUUID();
  const config = buildDefaultLobbyConfig(gameMode);

  const lobby: Lobby = {
    id: lobbyId,
    ownerSessionId: owner.sessionId,
    players: [owner],
    config,
    readyPlayerIds: [],
  };

  await firebaseAddLobby(lobby);
  return lobby;
}
