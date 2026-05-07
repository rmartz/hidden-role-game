import { GameMode } from "@/lib/types";
import type { ClocktowerPlayerGameState } from "@/lib/game/modes/clocktower/player-state";
import {
  type FirebaseBasePlayerState,
  baseStateToFirebase,
  baseStateFromFirebase,
} from "./base";

// ---------------------------------------------------------------------------
// Clocktower-specific Firebase player state
// ---------------------------------------------------------------------------

export interface FirebaseClocktowerPlayerState extends FirebaseBasePlayerState {
  seatedOrder?: string[];
  /** JSON-serialized ClocktowerNomination[]. */
  nominations?: string;
  myGhostVoteAvailable?: boolean;
  nightInformation?: string;
  /** Storyteller-only: poisoned player ID. */
  poisonedIndicator?: string;
  /** Storyteller-only: Drunk player ID. */
  drunkIndicator?: string;
}

// ---------------------------------------------------------------------------
// Clocktower serializer / deserializer
// ---------------------------------------------------------------------------

export function clocktowerStateToFirebase(
  state: ClocktowerPlayerGameState,
): FirebaseClocktowerPlayerState {
  return {
    ...baseStateToFirebase(state),
    ...(state.seatedOrder?.length ? { seatedOrder: state.seatedOrder } : {}),
    ...(state.nominations?.length
      ? { nominations: JSON.stringify(state.nominations) }
      : {}),
    ...(state.myGhostVoteAvailable !== undefined
      ? { myGhostVoteAvailable: state.myGhostVoteAvailable }
      : {}),
    ...(state.nightInformation !== undefined
      ? { nightInformation: state.nightInformation }
      : {}),
    ...(state.poisonedIndicator !== undefined
      ? { poisonedIndicator: state.poisonedIndicator }
      : {}),
    ...(state.drunkIndicator !== undefined
      ? { drunkIndicator: state.drunkIndicator }
      : {}),
  };
}

export function clocktowerStateFromFirebase(
  raw: FirebaseClocktowerPlayerState,
): ClocktowerPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Clocktower,
    ...(raw.seatedOrder?.length ? { seatedOrder: raw.seatedOrder } : {}),
    ...(raw.nominations !== undefined
      ? {
          nominations: JSON.parse(
            raw.nominations,
          ) as ClocktowerPlayerGameState["nominations"],
        }
      : {}),
    ...(raw.myGhostVoteAvailable !== undefined
      ? { myGhostVoteAvailable: raw.myGhostVoteAvailable }
      : {}),
    ...(raw.nightInformation !== undefined
      ? { nightInformation: raw.nightInformation }
      : {}),
    ...(raw.poisonedIndicator !== undefined
      ? { poisonedIndicator: raw.poisonedIndicator }
      : {}),
    ...(raw.drunkIndicator !== undefined
      ? { drunkIndicator: raw.drunkIndicator }
      : {}),
  };
}
