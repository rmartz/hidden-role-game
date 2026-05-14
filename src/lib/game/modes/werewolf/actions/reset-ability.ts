import type { Game, GameAction } from "@/lib/types";
import { currentTurnState, isOwnerPlaying } from "../utils";
import { WerewolfRole } from "../roles";

/** Role IDs whose once-per-game abilities the narrator can reset. */
const RESETTABLE_ROLE_IDS = new Set<string>([
  WerewolfRole.Witch,
  WerewolfRole.Exposer,
  WerewolfRole.Mortician,
]);

export const resetAbilityAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    if (!isOwnerPlaying(game, callerId)) return false;
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (!payload || typeof payload !== "object") return false;
    const { roleId } = payload as { roleId?: unknown };
    if (typeof roleId !== "string") return false;
    return RESETTABLE_ROLE_IDS.has(roleId);
  },
  apply(game: Game, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return;
    if (!payload || typeof payload !== "object") return;
    const { roleId } = payload as { roleId: string };
    const rs = ts.roleState ?? {};
    if (roleId === (WerewolfRole.Witch as string)) {
      ts.roleState = { ...rs, witch: undefined };
    } else if (roleId === (WerewolfRole.Exposer as string)) {
      // Clear abilityUsed but preserve reveal if present.
      const { reveal } = rs.exposer ?? {};
      ts.roleState = { ...rs, exposer: reveal ? { reveal } : undefined };
    } else if (roleId === (WerewolfRole.Mortician as string)) {
      ts.roleState = { ...rs, mortician: undefined };
    }
  },
};
