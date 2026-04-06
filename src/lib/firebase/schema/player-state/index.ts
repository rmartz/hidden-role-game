import { GameMode } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import {
  type FirebaseWerewolfPlayerState,
  werewolfStateToFirebase,
  werewolfStateFromFirebase,
} from "./werewolf";
import {
  type FirebaseSecretVillainPlayerState,
  secretVillainStateToFirebase,
  secretVillainStateFromFirebase,
} from "./secret-villain";
import {
  type FirebaseAvalonPlayerState,
  avalonStateToFirebase,
  avalonStateFromFirebase,
} from "./avalon";

export type { FirebaseBasePlayerState } from "./base";
export type { FirebaseWerewolfPlayerState } from "./werewolf";
export type { FirebaseSecretVillainPlayerState } from "./secret-villain";
export type { FirebaseAvalonPlayerState } from "./avalon";

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type FirebasePlayerState =
  | FirebaseWerewolfPlayerState
  | FirebaseSecretVillainPlayerState
  | FirebaseAvalonPlayerState;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function playerStateToFirebase(
  state: PlayerGameState,
): FirebasePlayerState {
  switch (state.gameMode) {
    case GameMode.Werewolf:
      return werewolfStateToFirebase(state);
    case GameMode.SecretVillain:
      return secretVillainStateToFirebase(state);
    case GameMode.Avalon:
      return avalonStateToFirebase(state);
  }
}

export function firebaseToPlayerState(
  raw: FirebasePlayerState,
): PlayerGameState {
  // gameMode is typed as string on FirebaseBasePlayerState (Firebase boundary),
  // so the discriminated union cannot be narrowed at compile time. Cast to
  // GameMode for the switch and narrow each branch individually.
  switch (raw.gameMode as GameMode) {
    case GameMode.Werewolf:
      return werewolfStateFromFirebase(raw as FirebaseWerewolfPlayerState);
    case GameMode.SecretVillain:
      return secretVillainStateFromFirebase(
        raw as FirebaseSecretVillainPlayerState,
      );
    case GameMode.Avalon:
      return avalonStateFromFirebase(raw);
    default:
      throw new Error(`Unknown game mode: ${raw.gameMode}`);
  }
}
