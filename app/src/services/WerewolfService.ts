import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { WEREWOLF_CONFIG } from "@/lib/game-modes/werewolf";
import { assignRoles } from "./assignRoles";

export class WerewolfService {
  readonly minPlayers = WEREWOLF_CONFIG.minPlayers;

  getRoleDefinitions(): Record<string, RoleDefinition> {
    return WEREWOLF_CONFIG.roles;
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    return WEREWOLF_CONFIG.defaultRoleCount(numPlayers);
  }
}

export const werewolfService = new WerewolfService();
