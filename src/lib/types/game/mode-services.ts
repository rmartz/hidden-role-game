import type { TimerConfig } from "../lobby";
import type { ModeConfig } from "../mode-config";
import type { RoleDefinition, Team } from "../role";
import type { RoleBucket } from "../role-bucket";
import type { Game, GameAction } from "./game";
import type { BaseLobbyConfig, LobbyConfig } from "./lobby";
import type { PlayerRoleAssignment } from "./player";

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

  /**
   * Optional hook called after the game transitions from Starting → Playing
   * and `game.status` has been set to the initial Playing status.
   * Use this to run any mode-specific initialization that requires a full
   * Game object (e.g. auto-computing initial night-phase results).
   */
  postInitialize?: (game: Game) => void;
}

export interface GameModeConfig {
  readonly name: string;
  /** Whether this game mode is available in production. Unreleased modes are only visible in development. */
  readonly released: boolean;
  /**
   * CSS theme identifier applied via `data-theme` when entering a lobby or game for this mode.
   * Corresponds to a `[data-theme="<value>"]` CSS selector that defines custom properties.
   * Defaults to `"twilight_modern"` when not specified.
   */
  readonly theme?: string;
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
   * Resolve which dead player IDs should have their roles revealed mid-game.
   * When not implemented, all provided dead player IDs are revealed.
   */
  resolveRevealDeadPlayerIds?(game: Game, deadPlayerIds: string[]): string[];
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
  /**
   * Returns the number of hidden (unassigned) roles to draw at game start for
   * a specific game configuration. Hidden roles are visible only to the narrator.
   * Returns 0 when not implemented (no hidden roles).
   */
  resolveHiddenRoleCount?(modeConfig: ModeConfig): number;
  /**
   * Validates mode-specific role count constraints beyond basic role ID validity
   * and slot count. Returns an error message, or undefined if valid.
   * Called for Custom (roleCounts) and Advanced (simple-bucket counts) modes.
   */
  validateRoleConfig?(roleCounts: Record<string, number>): string | undefined;
  readonly roles: Record<string, RoleDefinition<string, Team>>;
  readonly teamLabels: Partial<Record<Team, string>>;
  defaultRoleCount(numPlayers: number): RoleBucket[];
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
