import { GameMode } from "@/lib/types";
import type { BasePlayerGameState } from "@/server/types/game";

/** Avalon-specific extension of BasePlayerGameState (currently no extra fields). */
export interface AvalonPlayerGameState extends BasePlayerGameState {
  gameMode: GameMode.Avalon;
}
