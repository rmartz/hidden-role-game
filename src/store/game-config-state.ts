import { DEFAULT_GAME_MODE, GAME_MODES } from "@/lib/game/modes";
import type {
  GameMode,
  ModeConfig,
  RoleBucket,
  TimerConfig,
} from "@/lib/types";
import { RoleConfigMode, ShowRolesInPlay } from "@/lib/types";

export interface GameConfigState {
  gameMode: GameMode;
  playerCount: number;
  roleConfigMode: RoleConfigMode;
  /** Used for Custom mode (exact counts, min === max). */
  roleCounts: Record<string, number>;
  /** Used for Default/Custom/Advanced modes. */
  roleBuckets: RoleBucket[];
  showConfigToPlayers: boolean;
  showRolesInPlay: ShowRolesInPlay;
  timerConfig: TimerConfig;
  /** Game-mode-specific configuration. Discriminated by `modeConfig.gameMode`. */
  modeConfig: ModeConfig;
  isValid: boolean;
  /** Increments on every user-initiated action. Used to detect when a sync is needed. */
  syncVersion: number;
}

const defaultMode = DEFAULT_GAME_MODE;

export const initialState: GameConfigState = {
  gameMode: defaultMode,
  playerCount: 5,
  roleConfigMode: RoleConfigMode.Default,
  roleCounts: {},
  roleBuckets: [],
  showConfigToPlayers: false,
  showRolesInPlay: ShowRolesInPlay.None,
  timerConfig: GAME_MODES[defaultMode].defaultTimerConfig,
  modeConfig: GAME_MODES[defaultMode].defaultModeConfig,
  isValid: false,
  syncVersion: 0,
};
