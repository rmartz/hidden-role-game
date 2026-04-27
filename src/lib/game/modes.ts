import { GameMode } from "@/lib/types";
import type {
  AdvancedRoleBucket,
  GameModeConfig,
  ModeConfig,
  RoleBucket,
} from "@/lib/types";
import { SECRET_VILLAIN_CONFIG } from "@/lib/game/modes/secret-villain";
import { AVALON_CONFIG } from "@/lib/game/modes/avalon";
import { CLOCKTOWER_CONFIG } from "@/lib/game/modes/clocktower";
import { CODENAMES_CONFIG } from "@/lib/game/modes/codenames";
import { WEREWOLF_CONFIG } from "@/lib/game/modes/werewolf";

export { SecretVillainRole } from "@/lib/game/modes/secret-villain";
export { AvalonRole } from "@/lib/game/modes/avalon";
export { ClocktowerRole } from "@/lib/game/modes/clocktower";
export { CodenamesRole } from "@/lib/game/modes/codenames";
export { WerewolfRole } from "@/lib/game/modes/werewolf";

export function parseGameMode(value: string): GameMode | undefined {
  return (Object.values(GameMode) as string[]).includes(value)
    ? (value as GameMode)
    : undefined;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  [GameMode.Avalon]: AVALON_CONFIG,
  [GameMode.Clocktower]: CLOCKTOWER_CONFIG,
  [GameMode.Codenames]: CODENAMES_CONFIG,
  [GameMode.SecretVillain]: SECRET_VILLAIN_CONFIG,
  [GameMode.Werewolf]: WEREWOLF_CONFIG,
};

const isPreviewOrDev =
  process.env.NODE_ENV !== "production" ||
  process.env["NEXT_PUBLIC_VERCEL_ENV"] === "preview";

/** Returns whether a game mode is available in the current environment. */
export function isGameModeEnabled(mode: GameMode): boolean {
  return GAME_MODES[mode].released || isPreviewOrDev;
}

/** Game modes available in the current environment, sorted alphabetically by name. */
export const ENABLED_GAME_MODES: GameMode[] = Object.values(GameMode)
  .filter(isGameModeEnabled)
  .sort((a, b) => GAME_MODES[a].name.localeCompare(GAME_MODES[b].name));

/** All game modes sorted alphabetically by name, regardless of release status. */
export const ALL_GAME_MODES: GameMode[] = Object.values(GameMode).sort((a, b) =>
  GAME_MODES[a].name.localeCompare(GAME_MODES[b].name),
);

/** The default game mode — first alphabetical released mode. */
export const DEFAULT_GAME_MODE: GameMode =
  ENABLED_GAME_MODES.find((m) => GAME_MODES[m].released) ?? GameMode.Werewolf;

export function getDefaultRoleBuckets(
  gameMode: GameMode,
  playerCount: number,
): RoleBucket[] {
  const config = GAME_MODES[gameMode];
  const effectivePlayerCount = Math.max(playerCount, config.minPlayers);
  // Uses `roleSlotsRequired` (not `resolveRoleSlotsRequired`) because this is
  // called at lobby creation before any modeConfig is set (hiddenRoleCount = 0).
  const roleSlotsCount =
    config.roleSlotsRequired?.(effectivePlayerCount) ?? effectivePlayerCount;
  return config.defaultRoleCount(roleSlotsCount);
}

export function getRoleSlotsRequired(
  gameMode: GameMode,
  numPlayers: number,
  modeConfig?: ModeConfig,
): number {
  const config = GAME_MODES[gameMode];
  if (modeConfig && config.resolveRoleSlotsRequired) {
    return config.resolveRoleSlotsRequired(numPlayers, modeConfig);
  }
  return config.roleSlotsRequired?.(numPlayers) ?? numPlayers;
}

/**
 * Computes the total draw capacity of an advanced bucket: the sum of each
 * slot's `max`, treating `undefined` (uncapped) as `bucket.playerCount`.
 */
export function getAdvancedBucketMaxCapacity(
  bucket: AdvancedRoleBucket,
): number {
  return bucket.roles.reduce(
    (total, slot) => total + (slot.max ?? bucket.playerCount),
    0,
  );
}
