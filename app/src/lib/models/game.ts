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
}

export interface PlayerRoleAssignment {
  playerId: string;
  roleDefinitionId: string;
}

export interface RoleSlot {
  roleId: string;
  count: number;
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
  showRolesInPlay: boolean;
  ownerPlayerId: string | null;
}

// --- Lobby (top-level entity; game is absent until started) ---

export interface LobbyConfig {
  gameMode: GameMode;
  roleSlots: RoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: boolean;
}

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  config: LobbyConfig;
  gameId?: string;
}
