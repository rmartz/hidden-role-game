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
  readonly minPlayers: number;
  readonly ownerTitle: string | null;
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

export interface Game {
  id: string;
  lobbyId: string;
  gameMode: GameMode;
  status: GameStatusState;
  players: GamePlayer[];
  roleAssignments: PlayerRoleAssignment[];
  configuredRoleSlots: RoleSlot[];
  showRolesInPlay: ShowRolesInPlay;
  ownerPlayerId?: string;
  timerConfig: TimerConfig;
  /** Whether player nominations for trial are enabled. */
  nominationsEnabled: boolean;
  /** When true, only one trial is allowed per day phase. */
  singleTrialPerDay: boolean;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
  /** Executioner: the player ID the Executioner must get eliminated at trial. */
  executionerTargetId?: string;
}

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
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  autoAdvance: false,
  startCountdownSeconds: 10,
};

// --- Lobby (top-level entity; game is absent until started) ---

export interface LobbyConfig {
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  roleSlots: RoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  timerConfig: TimerConfig;
  /** Whether player nominations for trial are enabled. */
  nominationsEnabled: boolean;
  /** When true, only one trial is allowed per day phase. */
  singleTrialPerDay: boolean;
  /** When true, the night summary reveals players who were attacked but saved by protection. */
  revealProtections: boolean;
}

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  config: LobbyConfig;
  gameId?: string;
  readyPlayerIds: string[];
}
