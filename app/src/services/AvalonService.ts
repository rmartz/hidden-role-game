import { GameMode } from "@/lib/models";
import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { GAME_MODE_ROLES } from "@/lib/game-modes";
import { assignRoles } from "./assignRoles";

export class AvalonService {
  getRoleDefinitions(): RoleDefinition[] {
    return GAME_MODE_ROLES[GameMode.Avalon];
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    const bad = Math.floor((numPlayers - 1) / 2);
    const specialGood = 1;
    const good = numPlayers - bad - specialGood;
    return [
      { roleId: "avalon-bad", count: bad },
      { roleId: "avalon-special-good", count: specialGood },
      { roleId: "avalon-good", count: good },
    ];
  }
}

export const avalonService = new AvalonService();
