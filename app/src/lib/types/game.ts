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

export interface FinishedGameStatus {
  type: GameStatus.Finished;
  /** The winning team or role name (e.g. "Werewolves", "Village", "Chupacabra"). */
  winner?: string;
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
  /** Players matching these criteria are visible (name only, no role info). */
  awareOf?: { teams?: T[]; roles?: Role[] };
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
  readonly actions: Record<string, GameAction>;
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

export interface TimerConfig {
  /** When true, each phase automatically advances when its timer expires. */
  autoAdvance: boolean;
  /** Seconds for game-start countdown. */
  startCountdownSeconds: number;
  /** Seconds per night role phase. */
  nightPhaseSeconds: number;
  /** Seconds for day discussion. */
  dayPhaseSeconds: number;
  /** Seconds for a daytime elimination vote. */
  votePhaseSeconds: number;
  /** Seconds for the defense speech before an elimination vote. */
  defensePhaseSeconds: number;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  autoAdvance: true,
  startCountdownSeconds: 10,
  nightPhaseSeconds: 30,
  dayPhaseSeconds: 300,
  votePhaseSeconds: 20,
  defensePhaseSeconds: 10,
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
}

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  config: LobbyConfig;
  gameId?: string;
}
