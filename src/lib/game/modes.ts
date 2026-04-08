import { GameMode } from "@/lib/types";
import type { GameModeConfig, ModeConfig, RoleSlot } from "@/lib/types";
import { SECRET_VILLAIN_CONFIG } from "@/lib/game/modes/secret-villain";
import { AVALON_CONFIG } from "@/lib/game/modes/avalon";
import { WEREWOLF_CONFIG } from "@/lib/game/modes/werewolf";

export { SecretVillainRole } from "@/lib/game/modes/secret-villain";
export { AvalonRole } from "@/lib/game/modes/avalon";
export { WerewolfRole } from "@/lib/game/modes/werewolf";

export function parseGameMode(value: string): GameMode | undefined {
  return (Object.values(GameMode) as string[]).includes(value)
    ? (value as GameMode)
    : undefined;
}

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  [GameMode.SecretVillain]: SECRET_VILLAIN_CONFIG,
  [GameMode.Avalon]: AVALON_CONFIG,
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

export function getDefaultRoleSlots(
  gameMode: GameMode,
  playerCount: number,
): RoleSlot[] {
  const config = GAME_MODES[gameMode];
  return config.defaultRoleCount(Math.max(playerCount, config.minPlayers));
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
