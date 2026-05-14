import { GameMode } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";

import {
  avalonStateFromFirebase,
  avalonStateToFirebase,
  type FirebaseAvalonPlayerState,
} from "./avalon";
import {
  clocktowerStateFromFirebase,
  clocktowerStateToFirebase,
  type FirebaseClocktowerPlayerState,
} from "./clocktower";
import {
  codenamesStateFromFirebase,
  codenamesStateToFirebase,
  type FirebaseCodenamesPlayerState,
} from "./codenames";
import {
  type FirebaseSecretVillainPlayerState,
  secretVillainStateFromFirebase,
  secretVillainStateToFirebase,
} from "./secret-villain";
import {
  type FirebaseWerewolfPlayerState,
  werewolfStateFromFirebase,
  werewolfStateToFirebase,
} from "./werewolf";

export type { FirebaseAvalonPlayerState } from "./avalon";
export type { FirebaseBasePlayerState } from "./base";
export type { FirebaseClocktowerPlayerState } from "./clocktower";
export type { FirebaseCodenamesPlayerState } from "./codenames";
export type { FirebaseSecretVillainPlayerState } from "./secret-villain";
export type { FirebaseWerewolfPlayerState } from "./werewolf";

// ---------------------------------------------------------------------------
// Discriminated union
// ---------------------------------------------------------------------------

export type FirebasePlayerState =
  | FirebaseWerewolfPlayerState
  | FirebaseSecretVillainPlayerState
  | FirebaseAvalonPlayerState
  | FirebaseClocktowerPlayerState
  | FirebaseCodenamesPlayerState;

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
    case GameMode.Clocktower:
      return clocktowerStateToFirebase(state);
    case GameMode.Codenames:
      return codenamesStateToFirebase(state);
  }
}

export function firebaseToPlayerState(
  raw: FirebasePlayerState,
): PlayerGameState {
  // gameMode is typed as string on FirebaseBasePlayerState (Firebase boundary),
  // so the discriminated union cannot be narrowed at compile time. Cast to
  // GameMode for the switch. Only the Werewolf branch needs a further per-branch
  // cast because FirebaseWerewolfPlayerState has required fields absent from the
  // base type; the other modes add only optional fields and TypeScript accepts
  // raw directly.
  switch (raw.gameMode as GameMode) {
    case GameMode.Werewolf:
      return werewolfStateFromFirebase(raw as FirebaseWerewolfPlayerState);
    case GameMode.SecretVillain:
      return secretVillainStateFromFirebase(raw);
    case GameMode.Avalon:
      return avalonStateFromFirebase(raw);
    case GameMode.Clocktower:
      return clocktowerStateFromFirebase(raw as FirebaseClocktowerPlayerState);
    case GameMode.Codenames:
      return codenamesStateFromFirebase(raw);
    default:
      throw new Error(`Unknown game mode: ${raw.gameMode}`);
  }
}
