import { randomUUID } from "crypto";
import type { GameMode, Lobby, LobbyConfig } from "@/lib/types";
import {
  RoleConfigMode as RoleConfigModeEnum,
  ShowRolesInPlay as ShowRolesInPlayEnum,
} from "@/lib/types";
import { GAME_MODES, getDefaultRoleSlots } from "@/lib/game-modes";
import { addLobby as firebaseAddLobby } from "@/lib/firebase/lobby";

export async function addLobby(
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

  await firebaseAddLobby(lobby);
  return lobby;
}
