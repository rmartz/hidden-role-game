import type { GameModeServices } from "@/lib/types";

/** Stub services for Avalon — to be implemented with gameplay. */
export const avalonServices: GameModeServices = {
  buildInitialTurnState() {
    return undefined;
  },

  selectSpecialTargets() {
    return {};
  },

  extractPlayerState() {
    return {};
  },
};
