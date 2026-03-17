"use client";

import { createContext, useContext } from "react";
import type { GameMode } from "@/lib/types";

export const GameModeContext = createContext<GameMode | undefined>(undefined);

export function useGameModeContext(): GameMode {
  const ctx = useContext(GameModeContext);
  if (ctx === undefined) throw new Error("GameModeContext not provided");
  return ctx;
}
