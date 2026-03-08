import { GameMode } from "@/lib/models";
import type { RoleDefinition, RoleSlot } from "@/lib/models";
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

// The title given to the game owner in each mode, or null if the mode has no game owner.
export const GAME_MODE_OWNER_TITLES: Record<GameMode, string | null> = {
  [GameMode.SecretVillain]: null,
  [GameMode.Avalon]: null,
  [GameMode.Werewolf]: "Narrator",
};

export function getDefaultRoleSlots(
  gameMode: GameMode,
  playerCount: number,
): RoleSlot[] {
  const defaults = GAME_MODE_DEFAULT_ROLE_SLOTS[gameMode];
  const slots = defaults.map((s) => ({ ...s }));
  const minimumCount = slots.reduce((sum, s) => sum + s.count, 0);
  for (let i = minimumCount; i < playerCount; i++) {
    const maxIdx = slots.reduce(
      (best, s, j) => (s.count > (slots[best]?.count ?? 0) ? j : best),
      0,
    );
    const slot = slots[maxIdx];
    if (slot) slots[maxIdx] = { ...slot, count: slot.count + 1 };
  }
  return slots;
}

export const GAME_MODE_DEFAULT_ROLE_SLOTS: Record<GameMode, RoleSlot[]> = {
  [GameMode.SecretVillain]: [
    { roleId: "good", count: 3 },
    { roleId: "bad", count: 1 },
  ],
  [GameMode.Avalon]: [
    { roleId: "avalon-good", count: 3 },
    { roleId: "avalon-special-good", count: 1 },
    { roleId: "avalon-bad", count: 1 },
  ],
  [GameMode.Werewolf]: [
    { roleId: "werewolf-good", count: 3 },
    { roleId: "werewolf-bad", count: 1 },
  ],
};
