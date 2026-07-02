import type { AvalonModeConfig } from "@/lib/game/modes/avalon/lobby-config";
import type { ClocktowerModeConfig } from "@/lib/game/modes/clocktower/lobby-config";
import type { CodenamesModeConfig } from "@/lib/game/modes/codenames/lobby-config";
import type { SecretVillainModeConfig } from "@/lib/game/modes/secret-villain/lobby-config";
import type { SecretVillainTimerConfig } from "@/lib/game/modes/secret-villain/timer-config";
import type { WerewolfModeConfig } from "@/lib/game/modes/werewolf/lobby-config";
import type { WerewolfTimerConfig } from "@/lib/game/modes/werewolf/timer-config";

import type { GameStatusState } from "../game-status";
import type { TimerConfig } from "../lobby";
import type { RoleBucket } from "../role-bucket";
import type { GameMode, ShowRolesInPlay } from "./mode";
import type { GamePlayer, PlayerRoleAssignment } from "./player";

// --- Game (exists only after the game has been started) ---

/** Shared game fields. Game-mode-specific variants extend this. */
export interface BaseGame {
  id: string;
  lobbyId: string;
  status: GameStatusState;
  players: GamePlayer[];
  roleAssignments: PlayerRoleAssignment[];
  configuredRoleBuckets: RoleBucket[];
  showRolesInPlay: ShowRolesInPlay;
  ownerPlayerId?: string;
  /** Executioner: the player ID the Executioner must get eliminated at trial. */
  executionerTargetId?: string;
  /** Lobby seating order: player IDs in position order, used to set president rotation in Secret Villain. */
  playerOrder?: string[];
}

export interface WerewolfGame extends BaseGame {
  gameMode: GameMode.Werewolf;
  timerConfig: WerewolfTimerConfig;
  modeConfig: WerewolfModeConfig;
  /** Role IDs that were drawn but not assigned to players (hidden from everyone except the Narrator). */
  hiddenRoleIds?: string[];
}

export interface SecretVillainGame extends BaseGame {
  gameMode: GameMode.SecretVillain;
  timerConfig: SecretVillainTimerConfig;
  modeConfig: SecretVillainModeConfig;
}

export interface AvalonGame extends BaseGame {
  gameMode: GameMode.Avalon;
  timerConfig: TimerConfig;
  modeConfig: AvalonModeConfig;
}

export interface ClocktowerGame extends BaseGame {
  gameMode: GameMode.Clocktower;
  timerConfig: TimerConfig;
  modeConfig: ClocktowerModeConfig;
  /**
   * The Townsfolk role ID shown to the Drunk player as their fake token.
   * Assigned at game creation; only present when the Drunk is in play.
   */
  drunkFakeRoleId?: string;
}

export interface CodenamesGame extends BaseGame {
  gameMode: GameMode.Codenames;
  timerConfig: TimerConfig;
  modeConfig: CodenamesModeConfig;
}

/**
 * Discriminated union of all game-mode-specific game objects.
 * Narrow on `gameMode` to access typed `timerConfig` and `modeConfig`.
 */
export type Game =
  | WerewolfGame
  | SecretVillainGame
  | AvalonGame
  | ClocktowerGame
  | CodenamesGame;

/**
 * A game-mode-defined action that can be applied to a game. Actions are
 * validated before application; isValid must return true for apply to be called.
 */
export interface GameAction {
  isValid(game: Game, callerId: string, payload: unknown): boolean;
  apply(game: Game, payload: unknown, callerId: string): void;
}
