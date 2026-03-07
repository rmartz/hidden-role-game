import { GameMode } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";
import { SECRET_VILLAIN_ROLES } from "@/lib/game-modes/secret-villain-roles";
import { AVALON_ROLES } from "@/lib/game-modes/avalon-roles";
import { WEREWOLF_ROLES } from "@/lib/game-modes/werewolf-roles";

export const GAME_MODE_ROLES: Record<GameMode, RoleDefinition[]> = {
  [GameMode.SecretVillain]: SECRET_VILLAIN_ROLES,
  [GameMode.Avalon]: AVALON_ROLES,
  [GameMode.Werewolf]: WEREWOLF_ROLES,
};

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  [GameMode.SecretVillain]: "Secret Villain",
  [GameMode.Avalon]: "Avalon",
  [GameMode.Werewolf]: "Werewolf",
};
