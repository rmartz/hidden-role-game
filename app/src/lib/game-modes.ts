import { GameMode } from "@/lib/models";
import type { GameModeConfig, RoleSlot } from "@/lib/models";
import { SECRET_VILLAIN_CONFIG } from "@/lib/game-modes/secret-villain";
import { AVALON_CONFIG } from "@/lib/game-modes/avalon";
import { WEREWOLF_CONFIG } from "@/lib/game-modes/werewolf";

export { SecretVillainRole } from "@/lib/game-modes/secret-villain";
export { AvalonRole } from "@/lib/game-modes/avalon";
export { WerewolfRole } from "@/lib/game-modes/werewolf";

export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  [GameMode.SecretVillain]: SECRET_VILLAIN_CONFIG,
  [GameMode.Avalon]: AVALON_CONFIG,
  [GameMode.Werewolf]: WEREWOLF_CONFIG,
};

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
): number {
  const config = GAME_MODES[gameMode];
  return config.roleSlotsRequired?.(numPlayers) ?? numPlayers;
}
