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
}

export interface PlayingGameStatus {
  type: GameStatus.Playing;
  /** Present for game modes with structured turns (e.g. Werewolf). Typed per game mode. */
  turnState?: unknown;
}

export interface FinishedGameStatus {
  type: GameStatus.Finished;
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
  canSeeTeam?: T[];
  canSeeRole?: Role[];
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

export interface GamePlayer extends LobbyPlayer {
  visibleRoles: PlayerRoleAssignment[];
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
  ownerPlayerId: string | null;
  timerConfig?: TimerConfig;
}

/**
 * A game-mode-defined action that can be applied to a game. Actions are
 * validated before application; isValid must return true for apply to be called.
 */
export interface GameAction {
  isValid(game: Game, callerId: string, payload: unknown): boolean;
  apply(game: Game, payload: unknown): void;
}

// --- Phase Timer Configuration ---

export interface TimerConfig {
  /** Seconds for game-start countdown. null = no auto-advance (manual skip only). */
  startCountdownSeconds: number | null;
  /** Seconds per night role phase. null = manual only. */
  nightPhaseSeconds: number | null;
  /** Seconds for day discussion. null = manual only. */
  dayPhaseSeconds: number | null;
}

// --- Lobby (top-level entity; game is absent until started) ---

export interface LobbyConfig {
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  roleSlots: RoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  timerConfig?: TimerConfig;
}

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  config: LobbyConfig;
  gameId?: string;
}
