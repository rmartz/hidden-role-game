import { GameMode } from "@/lib/types";
import type { CodenamesPlayerGameState } from "@/lib/game/modes/codenames/player-state";
import {
  type FirebaseBasePlayerState,
  baseStateToFirebase,
  baseStateFromFirebase,
} from "./base";

// ---------------------------------------------------------------------------
// Codenames-specific Firebase player state
// ---------------------------------------------------------------------------

export interface FirebaseCodenamesPlayerState extends FirebaseBasePlayerState {
  /** JSON-serialized BoardCard[]. */
  board?: string;
  /** JSON-serialized CodenamesTurnPhase. */
  codenamesPhase?: string;
  /** JSON-serialized Clue[]. */
  clueHistory?: string;
  codenamesTurn?: number;
  activeTeam?: string;
  startingTeam?: string;
}

// ---------------------------------------------------------------------------
// Codenames serializer / deserializer
// ---------------------------------------------------------------------------

export function codenamesStateToFirebase(
  state: CodenamesPlayerGameState,
): FirebaseCodenamesPlayerState {
  return {
    ...baseStateToFirebase(state),
    ...(state.board !== undefined
      ? { board: JSON.stringify(state.board) }
      : {}),
    ...(state.codenamesPhase !== undefined
      ? { codenamesPhase: JSON.stringify(state.codenamesPhase) }
      : {}),
    ...(state.clueHistory?.length
      ? { clueHistory: JSON.stringify(state.clueHistory) }
      : {}),
    ...(state.codenamesTurn !== undefined
      ? { codenamesTurn: state.codenamesTurn }
      : {}),
    ...(state.activeTeam !== undefined ? { activeTeam: state.activeTeam } : {}),
    ...(state.startingTeam !== undefined
      ? { startingTeam: state.startingTeam }
      : {}),
  };
}

export function codenamesStateFromFirebase(
  raw: FirebaseCodenamesPlayerState,
): CodenamesPlayerGameState {
  return {
    ...baseStateFromFirebase(raw),
    gameMode: GameMode.Codenames,
    ...(raw.board !== undefined
      ? {
          board: JSON.parse(raw.board) as CodenamesPlayerGameState["board"],
        }
      : {}),
    ...(raw.codenamesPhase !== undefined
      ? {
          codenamesPhase: JSON.parse(
            raw.codenamesPhase,
          ) as CodenamesPlayerGameState["codenamesPhase"],
        }
      : {}),
    ...(raw.clueHistory !== undefined
      ? {
          clueHistory: JSON.parse(
            raw.clueHistory,
          ) as CodenamesPlayerGameState["clueHistory"],
        }
      : {}),
    ...(raw.codenamesTurn !== undefined
      ? { codenamesTurn: raw.codenamesTurn }
      : {}),
    ...(raw.activeTeam !== undefined
      ? {
          activeTeam: raw.activeTeam as CodenamesPlayerGameState["activeTeam"],
        }
      : {}),
    ...(raw.startingTeam !== undefined
      ? {
          startingTeam:
            raw.startingTeam as CodenamesPlayerGameState["startingTeam"],
        }
      : {}),
  };
}
