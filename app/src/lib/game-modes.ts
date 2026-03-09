import { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/lib/models";
import * as secretVillain from "@/lib/game-modes/secret-villain";
import * as avalon from "@/lib/game-modes/avalon";
import * as werewolf from "@/lib/game-modes/werewolf";

export {
  SecretVillainRole,
  SecretVillainTeam,
} from "@/lib/game-modes/secret-villain";
export { AvalonRole, AvalonTeam } from "@/lib/game-modes/avalon";
export { WerewolfRole, WerewolfTeam } from "@/lib/game-modes/werewolf";

export const GAME_MODE_ROLES: {
  [GameMode.SecretVillain]: typeof secretVillain.SECRET_VILLAIN_ROLES;
  [GameMode.Avalon]: typeof avalon.AVALON_ROLES;
  [GameMode.Werewolf]: typeof werewolf.WEREWOLF_ROLES;
} = {
  [GameMode.SecretVillain]: secretVillain.SECRET_VILLAIN_ROLES,
  [GameMode.Avalon]: avalon.AVALON_ROLES,
  [GameMode.Werewolf]: werewolf.WEREWOLF_ROLES,
};

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  [GameMode.SecretVillain]: "Secret Villain",
  [GameMode.Avalon]: "Avalon",
  [GameMode.Werewolf]: "Werewolf",
};

const GAME_MODE_CONFIG: Record<
  GameMode,
  { minPlayers: number; defaultRoleCount: (n: number) => RoleSlot[] }
> = {
  [GameMode.SecretVillain]: {
    minPlayers: secretVillain.MIN_PLAYERS,
    defaultRoleCount: secretVillain.defaultRoleCount,
  },
  [GameMode.Avalon]: {
    minPlayers: avalon.MIN_PLAYERS,
    defaultRoleCount: avalon.defaultRoleCount,
  },
  [GameMode.Werewolf]: {
    minPlayers: werewolf.MIN_PLAYERS,
    defaultRoleCount: werewolf.defaultRoleCount,
  },
};

export function getDefaultRoleSlots(
  gameMode: GameMode,
  playerCount: number,
): RoleSlot[] {
  const { minPlayers, defaultRoleCount } = GAME_MODE_CONFIG[gameMode];
  return defaultRoleCount(Math.max(playerCount, minPlayers));
}
