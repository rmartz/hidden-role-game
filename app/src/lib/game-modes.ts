import { GameMode } from "@/lib/models";
import type { RoleDefinition, RoleSlot } from "@/lib/models";
import {
  SECRET_VILLAIN_ROLES,
  SecretVillainRole,
  SecretVillainTeam,
} from "@/lib/game-modes/secret-villain-roles";
import {
  AVALON_ROLES,
  AvalonRole,
  AvalonTeam,
} from "@/lib/game-modes/avalon-roles";
import {
  WEREWOLF_ROLES,
  WerewolfRole,
  WerewolfTeam,
} from "@/lib/game-modes/werewolf-roles";

export {
  SecretVillainRole,
  SecretVillainTeam,
  AvalonRole,
  AvalonTeam,
  WerewolfRole,
  WerewolfTeam,
};

export const GAME_MODE_ROLES: {
  [GameMode.SecretVillain]: Record<
    SecretVillainRole,
    RoleDefinition<SecretVillainRole, SecretVillainTeam>
  >;
  [GameMode.Avalon]: Record<AvalonRole, RoleDefinition<AvalonRole, AvalonTeam>>;
  [GameMode.Werewolf]: Record<
    WerewolfRole,
    RoleDefinition<WerewolfRole, WerewolfTeam>
  >;
} = {
  [GameMode.SecretVillain]: SECRET_VILLAIN_ROLES,
  [GameMode.Avalon]: AVALON_ROLES,
  [GameMode.Werewolf]: WEREWOLF_ROLES,
};

export const GAME_MODE_NAMES: Record<GameMode, string> = {
  [GameMode.SecretVillain]: "Secret Villain",
  [GameMode.Avalon]: "Avalon",
  [GameMode.Werewolf]: "Werewolf",
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
    { roleId: SecretVillainRole.Good, count: 3 },
    { roleId: SecretVillainRole.Bad, count: 1 },
  ],
  [GameMode.Avalon]: [
    { roleId: AvalonRole.Good, count: 3 },
    { roleId: AvalonRole.SpecialGood, count: 1 },
    { roleId: AvalonRole.Bad, count: 1 },
  ],
  [GameMode.Werewolf]: [
    { roleId: WerewolfRole.Good, count: 3 },
    { roleId: WerewolfRole.Bad, count: 1 },
  ],
};
