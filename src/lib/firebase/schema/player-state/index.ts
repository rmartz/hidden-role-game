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
import {
  type FirebaseClocktowerPlayerState,
  clocktowerStateToFirebase,
  clocktowerStateFromFirebase,
} from "./clocktower";
import {
  type FirebaseCodenamesPlayerState,
  codenamesStateToFirebase,
  codenamesStateFromFirebase,
} from "./codenames";

export type { FirebaseBasePlayerState } from "./base";
export type { FirebaseWerewolfPlayerState } from "./werewolf";
export type { FirebaseSecretVillainPlayerState } from "./secret-villain";
export type { FirebaseAvalonPlayerState } from "./avalon";
export type { FirebaseClocktowerPlayerState } from "./clocktower";
export type { FirebaseCodenamesPlayerState } from "./codenames";

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
