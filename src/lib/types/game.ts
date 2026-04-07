import type { ModeConfig } from "./mode-config";
import type {
  WerewolfLobbyConfig,
  WerewolfModeConfig,
} from "@/lib/game/modes/werewolf/lobby-config";
import type { WerewolfTimerConfig } from "@/lib/game/modes/werewolf/timer-config";
import type {
  SecretVillainLobbyConfig,
  SecretVillainModeConfig,
} from "@/lib/game/modes/secret-villain/lobby-config";
import type { SecretVillainTimerConfig } from "@/lib/game/modes/secret-villain/timer-config";
import type {
  AvalonLobbyConfig,
  AvalonModeConfig,
} from "@/lib/game/modes/avalon/lobby-config";

export interface LobbyPlayer {
  id: string;
  name: string;
  sessionId: string;
}

// --- Game Status (no Lobby — Lobby is a separate concept) ---

export enum GameStatus {
  Starting = "Starting",
  Playing = "Playing",
  Finished = "Finished",
}

export interface StartingGameStatus {
  type: GameStatus.Starting;
  /** Unix epoch ms when the game entered Starting status. */
  startedAt?: number;
}

export interface PlayingGameStatus {
  type: GameStatus.Playing;
  /** Present for game modes with structured turns (e.g. Werewolf). Typed per game mode. */
  turnState?: unknown;
}

/**
 * Union of all valid winner identifiers across game modes.
 * Werewolf: "Village", "Werewolves", "Chupacabra", "Draw", "LoneWolf", "Tanner", "Spoiler", "Executioner"
 * Secret Villain: "Good", "Bad"
 */
export type GameWinner =
  | "Village"
  | "Werewolves"
  | "Chupacabra"
  | "Draw"
  | "LoneWolf"
  | "Tanner"
  | "Spoiler"
  | "Executioner"
  | "Good"
  | "Bad";

export interface FinishedGameStatus {
  type: GameStatus.Finished;
  /** The winning team or role identifier. */
  winner?: GameWinner;
}

export type GameStatusState =
  | StartingGameStatus
  | PlayingGameStatus
  | FinishedGameStatus;

// --- Game Modes ---

export enum GameMode {
  SecretVillain = "secret-villain",
  Avalon = "avalon",
  Werewolf = "werewolf",
}

// --- Role Config Modes ---

export enum RoleConfigMode {
  Default = "Default",
  Custom = "Custom",
  Advanced = "Advanced",
}

// --- Show Roles In Play Options ---

export enum ShowRolesInPlay {
  None = "None",
  ConfiguredOnly = "ConfiguredOnly",
  AssignedRolesOnly = "AssignedRolesOnly",
  RoleAndCount = "RoleAndCount",
}

// --- Roles ---

export enum Team {
  Good = "Good",
  Bad = "Bad",
  Neutral = "Neutral",
}

export interface RoleDefinition<
  Role extends string = string,
  T extends string = string,
> {
  id: Role;
  name: string;
  team: T;
  /** Short one-line description shown in tooltips and glossary headers. */
  summary?: string;
  /** Full description shown in the expanded glossary entry. */
  description?: string;
  /**
   * Players matching these criteria are visible.
   * By default only identity is revealed. Set `revealRole: true` to also
   * reveal the exact role of matched players.
   */
  awareOf?: { teams?: T[]; roles?: Role[]; revealRole?: boolean };
  /** Used to group roles in the role config UI and glossary. */
  category?: string;
}

/**
 * Game-mode-specific service methods for state extraction and initialization.
 * Each game mode implements this interface to handle its own turn state
 * structure, phases, and per-player state serialization.
 *
 * Return types use `Record<string, unknown>` to avoid circular imports with
 * PlayerGameState (defined in @/server/types). Implementations cast to the
 * concrete Partial<PlayerGameState> type.
 */
export interface GameModeServices {
  /** Build initial turn state when transitioning from Starting → Playing. */
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
    options?: Record<string, unknown>,
  ): unknown;

  /**
   * Select mode-specific targets at game creation time.
   * Returns a record of target fields to merge into the Game object
   * (e.g. `{ executionerTargetId: "player-1" }`).
   */
  selectSpecialTargets(
    roleAssignments: PlayerRoleAssignment[],
  ): Record<string, string>;

  /**
   * Extract mode-specific state for any player (owner or non-owner).
   * The implementation determines what to return based on the caller's role
   * in the game. `myRole` is undefined for the owner/narrator.
   * Returns partial PlayerGameState fields to spread into the player's state.
   */
  extractPlayerState(
    game: Game,
    callerId: string,
    myRole: RoleDefinition | undefined,
  ): Record<string, unknown>;
}

export interface GameModeConfig {
  readonly name: string;
  /** Whether this game mode is available in production. Unreleased modes are only visible in development. */
  readonly released: boolean;
  readonly minPlayers: number;
  readonly ownerTitle: string | null;
  /**
   * Returns the owner title for a specific game configuration.
   * Use this instead of `ownerTitle` when the title can vary per-game
   * (e.g. an optional Board player whose presence is controlled by modeConfig).
   * Falls back to `ownerTitle` when not implemented.
   */
  resolveOwnerTitle?(modeConfig: ModeConfig): string | null;
  /**
   * Returns whether the owner player should see all role assignments.
   * When false (e.g. Board player), only public state is shown.
   * Default: true (Narrator pattern).
   */
  resolveOwnerSeesRoleAssignments?(modeConfig: ModeConfig): boolean;
  /**
   * Returns the number of role slots required for a specific game configuration.
   * Use when slot count depends on modeConfig (e.g. optional Board player).
   * Falls back to `roleSlotsRequired` when not implemented.
   */
  resolveRoleSlotsRequired?(numPlayers: number, modeConfig: ModeConfig): number;
  /**
   * Returns whether the current role counts are valid for a specific game configuration.
   * Use when validity depends on modeConfig (e.g. optional Board player).
   * Falls back to `isValidRoleCount` when not implemented.
   */
  resolveIsValidRoleCount?(
    numPlayers: number,
    roleCounts: Record<string, number>,
    modeConfig: ModeConfig,
  ): boolean;
  readonly roles: Record<string, RoleDefinition<string, Team>>;
  readonly teamLabels: Partial<Record<Team, string>>;
  defaultRoleCount(numPlayers: number): RoleSlot[];
  /**
   * Returns the number of role slots that must be filled for a game with
   * numPlayers total players. Game modes that reserve one player as a non-role
   * owner (e.g. Werewolf's Narrator) should override this.
   *
   * Default: numPlayers.
   */
  roleSlotsRequired?(numPlayers: number): number;
  /**
   * Returns whether the current role counts form a valid assignment for the
   * given number of players. Game modes that reserve one player as a non-role
   * owner (e.g. Werewolf's Narrator) should override this to subtract that
   * player from the required slot count.
   *
   * Default: total assigned roles must equal numPlayers.
   */
  isValidRoleCount?(
    numPlayers: number,
    roleCounts: Record<string, number>,
  ): boolean;
  readonly defaultTimerConfig: TimerConfig;
  /** Default game-mode-specific lobby config fields. */
  readonly defaultModeConfig: ModeConfig;
  /** Parse raw Firebase data into typed mode-specific config, applying defaults. */
  parseModeConfig(raw: Record<string, unknown>): ModeConfig;
  /** Build a complete default lobby config from a base config for this game mode. */
  buildDefaultLobbyConfig(base: BaseLobbyConfig): LobbyConfig;
  readonly actions: Record<string, GameAction>;
  readonly services: GameModeServices;
}

export interface PlayerRoleAssignment {
  playerId: string;
  roleDefinitionId: string;
}

export interface RoleSlot {
  roleId: string;
  min: number;
  max: number;
}

export type VisibilityReason = "wake-partner" | "aware-of";

export interface VisiblePlayer {
  playerId: string;
  reason: VisibilityReason;
  /** When set, the player's role is known (not just their identity). */
  roleId?: string;
}

export interface GamePlayer extends LobbyPlayer {
  visiblePlayers: VisiblePlayer[];
}

// --- Game (exists only after the game has been started) ---

/** Shared game fields. Game-mode-specific variants extend this. */
export interface BaseGame {
  id: string;
  lobbyId: string;
  status: GameStatusState;
  players: GamePlayer[];
  roleAssignments: PlayerRoleAssignment[];
  configuredRoleSlots: RoleSlot[];
  showRolesInPlay: ShowRolesInPlay;
  ownerPlayerId?: string;
  /** Executioner: the player ID the Executioner must get eliminated at trial. */
  executionerTargetId?: string;
}

export interface WerewolfGame extends BaseGame {
  gameMode: GameMode.Werewolf;
  timerConfig: WerewolfTimerConfig;
  modeConfig: WerewolfModeConfig;
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

/**
 * Discriminated union of all game-mode-specific game objects.
 * Narrow on `gameMode` to access typed `timerConfig` and `modeConfig`.
 */
export type Game = WerewolfGame | SecretVillainGame | AvalonGame;

/**
 * A game-mode-defined action that can be applied to a game. Actions are
 * validated before application; isValid must return true for apply to be called.
 */
export interface GameAction {
  isValid(game: Game, callerId: string, payload: unknown): boolean;
  apply(game: Game, payload: unknown, callerId: string): void;
}

// --- Phase Timer Configuration ---

/** Base timer configuration shared across all game modes. */
export interface TimerConfig {
  /** When true, each phase automatically advances when its timer expires. */
  autoAdvance: boolean;
  /** Seconds for game-start countdown. */
  startCountdownSeconds: number;
  /** Index signature for game-mode-specific timer fields (e.g. nightPhaseSeconds). */
  [field: string]: boolean | number;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  autoAdvance: false,
  startCountdownSeconds: 10,
};

// --- Lobby (top-level entity; game is absent until started) ---

/** Shared lobby config fields. Game-mode-specific variants extend this. */
export interface BaseLobbyConfig {
  roleConfigMode: RoleConfigMode;
  roleSlots: RoleSlot[];
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
  | AvalonLobbyConfig;

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  config: LobbyConfig;
  gameId?: string;
  readyPlayerIds: string[];
}
