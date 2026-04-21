import { GameStatus } from "@/lib/types";
import type { Game, GameModeServices, PlayerRoleAssignment } from "@/lib/types";
import { ClocktowerPhase } from "./types";
import type { ClocktowerTurnState } from "./types";
import {
  ClocktowerCharacterType,
  ClocktowerRole,
  getClocktowerRole,
} from "./roles";
import type { ClocktowerRoleDefinition } from "./roles";
import type { ClocktowerGame } from "@/lib/types/game";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currentTurnState(game: Game): ClocktowerTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as ClocktowerTurnState | undefined;
}

/**
 * Pick a random Townsfolk role from the game's role assignments to serve as
 * the Drunk's fake token. Excludes the Drunk itself and any non-Townsfolk.
 */
function pickDrunkFakeRole(
  roleAssignments: PlayerRoleAssignment[],
): string | undefined {
  const townsfolkRoles = roleAssignments
    .map((a) => getClocktowerRole(a.roleDefinitionId))
    .filter(
      (r): r is ClocktowerRoleDefinition =>
        r !== undefined && !r.showsFakeTownsfolkToken,
    )
    .filter((r) => r.characterType === ClocktowerCharacterType.Townsfolk);

  if (townsfolkRoles.length === 0) return undefined;
  const idx = Math.floor(Math.random() * townsfolkRoles.length);
  return townsfolkRoles[idx]?.id;
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const clocktowerServices: GameModeServices = {
  buildInitialTurnState(
    roleAssignments: PlayerRoleAssignment[],
  ): ClocktowerTurnState {
    const playerIds = roleAssignments.map((a) => a.playerId);

    const demonAssignment = roleAssignments.find(
      (a) => a.roleDefinitionId === (ClocktowerRole.Imp as string),
    );
    if (!demonAssignment)
      throw new Error("Clocktower turn state requires an Imp assignment");

    return {
      turn: 1,
      phase: {
        type: ClocktowerPhase.Night,
        currentActionIndex: 0,
        nightActions: {},
      },
      playerOrder: playerIds,
      deadPlayerIds: [],
      ghostVotesUsed: [],
      demonPlayerId: demonAssignment.playerId,
    };
  },

  selectSpecialTargets(
    roleAssignments: PlayerRoleAssignment[],
  ): Record<string, string> {
    const drunkAssignment = roleAssignments.find(
      (a) => a.roleDefinitionId === (ClocktowerRole.Drunk as string),
    );
    if (!drunkAssignment) return {};

    const fakeRoleId = pickDrunkFakeRole(roleAssignments);
    if (!fakeRoleId) return {};

    return { drunkFakeRoleId: fakeRoleId };
  },

  extractPlayerState(game: Game, callerId: string): Record<string, unknown> {
    const ts = currentTurnState(game);
    if (!ts) return {};

    const isStoryteller = callerId === game.ownerPlayerId;
    const result: Record<string, unknown> = {};

    result["seatedOrder"] = ts.playerOrder;
    result["deadPlayerIds"] = ts.deadPlayerIds.length
      ? ts.deadPlayerIds
      : undefined;

    if (ts.phase.type === ClocktowerPhase.Day) {
      result["nominations"] = ts.phase.nominations;
    }

    if (isStoryteller) {
      if (ts.poisonedPlayerId) {
        result["poisonedIndicator"] = ts.poisonedPlayerId;
      }
      if (ts.drunkPlayerId) {
        result["drunkIndicator"] = ts.drunkPlayerId;
      }
      return result;
    }

    // Per-player state
    const isDead = ts.deadPlayerIds.includes(callerId);
    if (isDead) {
      result["amDead"] = true;
      const ghostVoteAvailable = !ts.ghostVotesUsed.includes(callerId);
      result["myGhostVoteAvailable"] = ghostVoteAvailable;
    }

    // Drunk sees their fake role instead of their real one; the base state
    // already sets myRole from the real assignment, but we override via
    // modeState only — the Drunk's fake role is shown as their role.
    const ctGame = game as ClocktowerGame;
    if (ts.drunkPlayerId === callerId && ctGame.drunkFakeRoleId !== undefined) {
      const fakeRole = getClocktowerRole(ctGame.drunkFakeRoleId);
      if (fakeRole !== undefined) {
        result["myRole"] = {
          id: fakeRole.id,
          name: fakeRole.name,
          team: fakeRole.team,
        };
      }
    }

    return result;
  },
};
