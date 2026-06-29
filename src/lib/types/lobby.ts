// --- Lobby Player types ---

export interface DeviceLobbyPlayer {
  id: string;
  name: string;
  sessionId: string;
  noDevice?: false;
}

export interface NoDeviceLobbyPlayer {
  id: string;
  name: string;
  sessionId?: undefined;
  noDevice: true;
}

/**
 * Discriminated union: a `DeviceLobbyPlayer` always has a `sessionId`; a
 * `NoDeviceLobbyPlayer` never does and is managed entirely by the lobby owner.
 * Narrow on `noDevice` (or `sessionId !== undefined`) to access the typed field.
 */
export type LobbyPlayer = DeviceLobbyPlayer | NoDeviceLobbyPlayer;

// --- Phase Timer Configuration ---

/** Base timer configuration shared across all game modes. */
export interface TimerConfig {
  /** When true, each phase automatically advances when its timer expires. */
  autoAdvance: boolean;
  /** Seconds for game-start countdown. */
  startCountdownSeconds: number;
  /** Index signature for game-mode-specific timer fields (e.g. nightPhaseSeconds). */
  [field: string]: boolean | number;
}

export const DEFAULT_TIMER_CONFIG: TimerConfig = {
  autoAdvance: false,
  startCountdownSeconds: 10,
};
