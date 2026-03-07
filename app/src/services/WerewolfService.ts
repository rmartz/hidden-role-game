import { GameMode } from "@/lib/models";
import type {
  LobbyPlayer,
  PlayerRoleAssignment,
  RoleDefinition,
} from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { GAME_MODE_ROLES } from "@/lib/game-modes";
import { assignRoles } from "./assignRoles";

export class WerewolfService {
  getRoleDefinitions(): RoleDefinition[] {
    return GAME_MODE_ROLES[GameMode.Werewolf];
  }

  createRoleAssignments(
    players: LobbyPlayer[],
    roleSlots: RoleSlot[],
  ): PlayerRoleAssignment[] {
    return assignRoles(players, roleSlots);
  }

  defaultRoleCount(numPlayers: number): RoleSlot[] {
    const bad = Math.floor(numPlayers / 3);
    const good = numPlayers - bad;
    return [
      { roleId: "werewolf-bad", count: bad },
      { roleId: "werewolf-good", count: good },
    ];
  }
}

export const werewolfService = new WerewolfService();
