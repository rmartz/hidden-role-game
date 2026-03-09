import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { AVALON_ROLES, defaultRoleCount } from "@/lib/game-modes/avalon";
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
    return defaultRoleCount(numPlayers);
  }
}

export const avalonService = new AvalonService();
