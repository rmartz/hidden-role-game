import type { Game, PlayerRoleAssignment } from "@/lib/types";
import { GameStatus } from "@/lib/types";

import { WerewolfRole } from "../roles";
import type {
  AnyNightAction,
  NightResolutionEvent,
  WerewolfRoleTurnState,
} from "../types";
import { WerewolfPhase } from "../types";
import { checkWinCondition, WerewolfWinner } from "../utils";

interface BuildDaytimeStatusParams {
  turn: number;
  nightActions: Record<string, AnyNightAction>;
  revealedPlayerIds: string[];
  nightResolution: NightResolutionEvent[];
  newExposerReveal: { playerId: string; roleId: string } | undefined;
  knightedPlayerId: string | undefined;
  smitedPlayerIds: string[] | undefined;
  updatedDeadIds: string[];
  lastTargets: Record<string, string>;
  roleOverrides: Record<string, string> | undefined;
  newRoleState: WerewolfRoleTurnState;
}

/**
 * Builds the Playing game status for the transition into the daytime phase,
 * including only the optional fields that have relevant values.
 */
export function buildDaytimeStatus(
  p: BuildDaytimeStatusParams,
): Game["status"] {
  return {
    type: GameStatus.Playing,
    turnState: {
      turn: p.turn,
      phase: {
        type: WerewolfPhase.Daytime,
        startedAt: Date.now(),
        nightActions: p.nightActions,
        revealedPlayerIds: p.revealedPlayerIds,
        ...(p.nightResolution.length > 0
          ? { nightResolution: p.nightResolution }
          : {}),
        ...(p.newExposerReveal ? { exposerReveal: p.newExposerReveal } : {}),
        ...(p.knightedPlayerId !== undefined
          ? { knightedPlayerId: p.knightedPlayerId }
          : {}),
        ...(p.smitedPlayerIds?.length
          ? { smitedPlayerIds: p.smitedPlayerIds }
          : {}),
      },
      deadPlayerIds: p.updatedDeadIds,
      ...(Object.keys(p.lastTargets).length > 0
        ? { lastTargets: p.lastTargets }
        : {}),
      ...(p.roleOverrides ? { roleOverrides: p.roleOverrides } : {}),
      ...(Object.keys(p.newRoleState).length > 0
        ? { roleState: p.newRoleState }
        : {}),
    },
  };
}

/**
 * Applies end-of-night win conditions after the daytime turn state is built.
 * - Tanner wins immediately if killed at night.
 * - Otherwise, run the standard win-condition check unless the Hunter died
 *   this night (in which case resolution is deferred to the revenge target).
 * Mutates game.status in place when a terminal condition is met.
 */
export function applyStartDayEndConditions(
  game: Game,
  effectiveAssignments: PlayerRoleAssignment[],
  newDeadIds: string[],
  updatedDeadIds: string[],
  hunterDiedThisNight: boolean,
): void {
  const tannerAssignment = effectiveAssignments.find(
    (a) => a.roleDefinitionId === (WerewolfRole.Tanner as string),
  );
  if (tannerAssignment && newDeadIds.includes(tannerAssignment.playerId)) {
    game.status = {
      type: GameStatus.Finished,
      winner: WerewolfWinner.Tanner,
    };
    return;
  }

  if (!hunterDiedThisNight) {
    const winResult = checkWinCondition(game, updatedDeadIds);
    if (winResult) {
      game.status = winResult;
    }
  }
}
