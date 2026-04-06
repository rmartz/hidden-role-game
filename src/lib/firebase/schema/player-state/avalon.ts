import { GameMode } from "@/lib/types";
import type { AvalonPlayerGameState } from "@/lib/game/modes/avalon/player-state";
import {
  type FirebaseBasePlayerState,
  baseStateToFirebase,
  baseStateFromFirebase,
} from "./base";

// ---------------------------------------------------------------------------
// Avalon — base fields only
// ---------------------------------------------------------------------------

export type FirebaseAvalonPlayerState = FirebaseBasePlayerState;

// ---------------------------------------------------------------------------
// Avalon serializer / deserializer
// ---------------------------------------------------------------------------

export function avalonStateToFirebase(
  state: AvalonPlayerGameState,
): FirebaseAvalonPlayerState {
  return baseStateToFirebase(state);
}

export function avalonStateFromFirebase(
  raw: FirebaseAvalonPlayerState,
): AvalonPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Avalon,
  } as AvalonPlayerGameState;
}
