import { GameMode } from "@/lib/models";
import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { GAME_MODE_ROLES } from "@/lib/game-modes";
import { assignRoles } from "./assignRoles";

export class SecretVillainService {
  readonly hasGameOwner = false;
  readonly minPlayers = 5;

  getRoleDefinitions(): RoleDefinition[] {
    return GAME_MODE_ROLES[GameMode.SecretVillain];
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    const specialBad = 1;
    const bad = Math.floor((numPlayers - 1) / 2) - 1;
    const good = numPlayers - specialBad - bad;
    return [
      { roleId: "special-bad", count: specialBad },
      { roleId: "bad", count: bad },
      { roleId: "good", count: good },
    ];
  }
}

export const secretVillainService = new SecretVillainService();
