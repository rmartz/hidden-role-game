import type { LobbyPlayer } from "../lobby";

export interface PlayerRoleAssignment {
  playerId: string;
  roleDefinitionId: string;
}

export type VisibilityReason = "wake-partner" | "aware-of";

export interface VisiblePlayer {
  playerId: string;
  reason: VisibilityReason;
  /** When set, the player's role is known (not just their identity). */
  roleId?: string;
}

export type GamePlayer = LobbyPlayer & { visiblePlayers: VisiblePlayer[] };
