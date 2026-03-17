import { GameStatus } from "@/lib/types";
import type { Game, GameAction } from "@/lib/types";
import { WerewolfPhase } from "../types";
import {
  buildNightPhaseOrder,
  currentTurnState,
  isOwnerPlaying,
  GROUP_PHASE_KEY_SEPARATOR,
} from "../utils";
import { WerewolfRole } from "../roles";

export const startNightAction: GameAction = {
  isValid(game: Game, callerId: string) {
    if (!isOwnerPlaying(game, callerId)) return false;
    return currentTurnState(game)?.phase.type === WerewolfPhase.Daytime;
  },
  apply(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const nextTurn = ts.turn + 1;
    // If a Wolf Cub died last turn, Werewolves get an extra phase this night.
    // Use a suffixed key so the second phase has its own nightActions entry.
    const wolfCubBonusPhaseKey =
      WerewolfRole.Werewolf + GROUP_PHASE_KEY_SEPARATOR + "2";
    const extraGroupPhaseKeys = ts.wolfCubDied ? [wolfCubBonusPhaseKey] : [];
    const nightPhaseOrder = buildNightPhaseOrder(
      nextTurn,
      game.roleAssignments,
      ts.deadPlayerIds,
      extraGroupPhaseKeys,
    );
    game.status = {
      type: GameStatus.Playing,
      turnState: {
        turn: nextTurn,
        phase: {
          type: WerewolfPhase.Nighttime,
          startedAt: Date.now(),
          nightPhaseOrder,
          currentPhaseIndex: 0,
          nightActions: {},
        },
        deadPlayerIds: ts.deadPlayerIds,
        ...(ts.witchAbilityUsed ? { witchAbilityUsed: true } : {}),
        ...(ts.lastTargets ? { lastTargets: ts.lastTargets } : {}),
      },
    };
  },
};
