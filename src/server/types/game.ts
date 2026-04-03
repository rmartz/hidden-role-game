import type {
  GameStatusState,
  GameMode,
  RoleSlot,
  Team,
  TimerConfig,
} from "@/lib/types";
import type { PublicLobbyPlayer } from "./lobby";

export type { RoleSlot };

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

export interface PlayerGameState {
  status: GameStatusState;
  gameMode: GameMode;
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
}
