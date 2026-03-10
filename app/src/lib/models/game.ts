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
}

export interface GameModeConfig {
  readonly name: string;
  readonly minPlayers: number;
  readonly ownerTitle: string | null;
  readonly roles: Record<string, RoleDefinition<string, Team>>;
  readonly teamLabels: Partial<Record<Team, string>>;
  defaultRoleCount(numPlayers: number): RoleSlot[];
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
}

// --- Lobby (top-level entity; game is absent until started) ---

export interface LobbyConfig {
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  roleSlots: RoleSlot[];
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
}

export interface Lobby {
  id: string;
  ownerSessionId: string;
  players: LobbyPlayer[];
  config: LobbyConfig;
  gameId?: string;
}
