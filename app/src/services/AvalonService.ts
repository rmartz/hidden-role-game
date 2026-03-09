import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { AVALON_CONFIG } from "@/lib/game-modes/avalon";
import { assignRoles } from "./assignRoles";

export class AvalonService {
  readonly minPlayers = AVALON_CONFIG.minPlayers;

  getRoleDefinitions(): RoleDefinition[] {
    return Object.values(AVALON_CONFIG.roles);
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    return AVALON_CONFIG.defaultRoleCount(numPlayers);
  }
}

export const avalonService = new AvalonService();
