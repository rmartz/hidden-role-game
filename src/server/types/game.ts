import type { GameStatusState, Team, TimerConfig } from "@/lib/types";
import type { PublicLobbyPlayer } from "./lobby";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import type { AvalonPlayerGameState } from "@/lib/game/modes/avalon/player-state";

export interface CreateGameRequest {
  lobbyId: string;
}

export interface PublicRoleInfo {
  id: string;
  name: string;
  team: Team;
}

export interface RoleInPlay {
  id: string;
  name: string;
  team: Team;
  /** Configured minimum count for this role. */
  min: number;
  /** Configured maximum count for this role. */
  max: number;
  /** Actual assigned count. Only present for RoleAndCount mode. */
  count?: number;
}

export type VisibilityReason = "wake-partner" | "aware-of" | "revealed";

export interface VisibleTeammate {
  player: PublicLobbyPlayer;
  reason: VisibilityReason;
  /** Only present when the exact role is known (e.g., dead player reveal by narrator). */
  role?: PublicRoleInfo;
}

/** Night effects visible during the daytime summary. */
export interface DaytimeNightStatusEntry {
  targetPlayerId: string;
  effect:
    | "killed"
    | "protected"
    | "silenced"
    | "hypnotized"
    | "smited"
    | "survived"
    | "peaceful"
    | "altruist-sacrifice";
  /** For altruist-sacrifice: the player who was saved. */
  savedPlayerId?: string;
}

/** Night effects visible to the Witch during their nighttime phase only. */
export interface NighttimeNightStatusEntry {
  targetPlayerId: string;
  effect: "attacked";
}

export type NightStatusEntry =
  | DaytimeNightStatusEntry
  | NighttimeNightStatusEntry;

/** Explains the specific win condition that ended the game. */
export interface VictoryCondition {
  /** Short label shown on the game-over screen. */
  label: string;
  /** Which team this condition favours (for colour/icon selection). */
  winner: Team;
}

/** Shared player game state fields. Game-mode-specific variants extend this. */
export interface BasePlayerGameState {
  status: GameStatusState;
  /** The lobby this game was started from. Used for returning to the lobby after the game ends. */
  lobbyId: string;
  players: PublicLobbyPlayer[];
  gameOwner?: PublicLobbyPlayer;
  /** The current player's own player ID. Undefined for the narrator/owner. */
  myPlayerId?: string;
  myRole?: PublicRoleInfo;
  visibleRoleAssignments: VisibleTeammate[];
  rolesInPlay?: RoleInPlay[];
  /** Whether this player has been marked as dead/eliminated. */
  amDead?: boolean;
  /** Player IDs marked as dead/eliminated. */
  deadPlayerIds?: string[];
  /** Phase timer configuration. */
  timerConfig: TimerConfig;
  /** Explains which specific condition caused the game to end. Only present when the game is finished. */
  victoryCondition?: VictoryCondition;
}

/**
 * Discriminated union of all game-mode-specific player game states.
 * Narrow on `gameMode` to access mode-specific fields.
 */
export type PlayerGameState =
  | WerewolfPlayerGameState
  | SecretVillainPlayerGameState
  | AvalonPlayerGameState;
