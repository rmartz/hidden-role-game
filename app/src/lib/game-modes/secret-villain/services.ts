import type { GameModeServices } from "@/lib/types";

/** Stub services for Secret Villain — to be implemented with gameplay. */
export const secretVillainServices: GameModeServices = {
  buildInitialTurnState() {
    return undefined;
  },

  selectSpecialTargets() {
    return {};
  },

  extractOwnerState() {
    return {};
  },

  extractPlayerState() {
    return {};
  },
};
