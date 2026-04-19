import { GameMode } from "@/lib/types";
import type {
  ModeConfig,
  RoleBucket,
  RoleConfigMode,
  ShowRolesInPlay,
  TimerConfig,
} from "@/lib/types";
import type { WerewolfModeConfig } from "@/lib/game/modes/werewolf/lobby-config";
import type { WerewolfTimerConfig } from "@/lib/game/modes/werewolf/timer-config";
import type { SecretVillainModeConfig } from "@/lib/game/modes/secret-villain/lobby-config";
import type { SecretVillainTimerConfig } from "@/lib/game/modes/secret-villain/timer-config";
import type { AvalonModeConfig } from "@/lib/game/modes/avalon/lobby-config";
import type { ClocktowerModeConfig } from "@/lib/game/modes/clocktower/lobby-config";

export interface PublicLobbyPlayer {
  id: string;
  name: string;
}

/** Shared game config fields. Game-mode-specific variants extend this. */
export interface BaseGameConfig {
  roleConfigMode: RoleConfigMode;
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  roleBuckets: RoleBucket[];
}

export interface WerewolfGameConfig extends BaseGameConfig {
  gameMode: GameMode.Werewolf;
  timerConfig: WerewolfTimerConfig;
  modeConfig: WerewolfModeConfig;
}

export interface SecretVillainGameConfig extends BaseGameConfig {
  gameMode: GameMode.SecretVillain;
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainModeConfig;
}

export interface AvalonGameConfig extends BaseGameConfig {
  gameMode: GameMode.Avalon;
  timerConfig: TimerConfig;
  modeConfig: AvalonModeConfig;
}

export interface ClocktowerGameConfig extends BaseGameConfig {
  gameMode: GameMode.Clocktower;
  timerConfig: TimerConfig;
  modeConfig: ClocktowerModeConfig;
}

/**
 * Client-visible lobby configuration. roleSlots is optional — hidden from non-owner players.
 * Discriminated union on `gameMode`.
 */
export type GameConfig =
  | WerewolfGameConfig
  | SecretVillainGameConfig
  | AvalonGameConfig
  | ClocktowerGameConfig;

export interface PublicLobby {
  id: string;
  ownerPlayerId: string;
  players: PublicLobbyPlayer[];
  /** Ordered list of player IDs defining seating positions (index 0 = first seat). */
  playerOrder: string[];
  config: GameConfig;
  gameId?: string;
  readyPlayerIds: string[];
}

export interface CreateLobbyRequest {
  playerName: string;
  gameMode?: GameMode;
}

export interface JoinLobbyRequest {
  playerName: string;
}

export interface UpdatePlayerNameRequest {
  playerName: string;
}

export interface UpdateLobbyConfigRequest {
  showConfigToPlayers?: boolean;
  showRolesInPlay?: ShowRolesInPlay;
  roleConfigMode?: RoleConfigMode;
  gameMode?: GameMode;
  roleBuckets?: RoleBucket[];
  timerConfig?: TimerConfig;
  modeConfig?: ModeConfig;
}

export interface LobbyJoinResponse {
  lobby: PublicLobby;
  sessionId: string;
  playerId: string;
}
