import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { AVALON_ROLES, AvalonRole } from "@/lib/game-modes/avalon-roles";
import { assignRoles } from "./assignRoles";

export class AvalonService {
  readonly minPlayers = 5;

  getRoleDefinitions(): RoleDefinition[] {
    return Object.values(AVALON_ROLES);
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
      { roleId: AvalonRole.Bad, count: bad },
      { roleId: AvalonRole.SpecialGood, count: specialGood },
      { roleId: AvalonRole.Good, count: good },
    ];
  }
}

export const avalonService = new AvalonService();
