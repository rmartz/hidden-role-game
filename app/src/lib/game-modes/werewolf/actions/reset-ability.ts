import type { Game, GameAction } from "@/lib/types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WerewolfRole } from "../roles";

/** Ability flags the narrator can reset. */
const RESETTABLE_ABILITIES: Record<string, string> = {
  [WerewolfRole.Witch]: "witchAbilityUsed",
  [WerewolfRole.Exposer]: "exposerAbilityUsed",
  [WerewolfRole.Mortician]: "morticianAbilityEnded",
};

export const resetAbilityAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    const { roleId } = payload as { roleId?: unknown };
    if (typeof roleId !== "string") return false;
    return roleId in RESETTABLE_ABILITIES;
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    const { roleId } = payload as { roleId: string };
    const flagKey = RESETTABLE_ABILITIES[roleId];
    if (flagKey) {
      (ts as unknown as Record<string, unknown>)[flagKey] = undefined;
    }
  },
};
