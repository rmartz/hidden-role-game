import type { AvalonLobbyConfig } from "@/lib/game/modes/avalon/lobby-config";
import type { ClocktowerLobbyConfig } from "@/lib/game/modes/clocktower/lobby-config";
import type { CodenamesLobbyConfig } from "@/lib/game/modes/codenames/lobby-config";
import type { SecretVillainLobbyConfig } from "@/lib/game/modes/secret-villain/lobby-config";
import type { WerewolfLobbyConfig } from "@/lib/game/modes/werewolf/lobby-config";

import type { LobbyPlayer } from "../lobby";
import type { RoleBucket } from "../role-bucket";
import type { RoleConfigMode, ShowRolesInPlay } from "./mode";

// --- Lobby (top-level entity; game is absent until started) ---

/** Shared lobby config fields. Game-mode-specific variants extend this. */
export interface BaseLobbyConfig {
  roleConfigMode: RoleConfigMode;
  roleBuckets: RoleBucket[];
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
}

/**
 * Discriminated union of all game-mode-specific lobby configurations.
 * Narrow on `gameMode` to access typed `timerConfig` and `modeConfig`.
 */
export type LobbyConfig =
  | WerewolfLobbyConfig
  | SecretVillainLobbyConfig
  | AvalonLobbyConfig
  | ClocktowerLobbyConfig
  | CodenamesLobbyConfig;

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  /** Ordered list of player IDs defining seating positions (index 0 = first seat). */
  playerOrder: string[];
  config: LobbyConfig;
  gameId?: string;
  readyPlayerIds: string[];
  /** Unix ms timestamp set server-side when all players (including owner) ready up. Cleared on unready, player leave, or game start. */
  countdownStartedAt?: number;
}
