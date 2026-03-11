export enum LobbyChangeReason {
  Connected = "connected",
  PlayerJoined = "player_joined",
  PlayerLeft = "player_left",
  ConfigChanged = "config_changed",
  OwnerChanged = "owner_changed",
  GameStarted = "game_started",
}

/**
 * Notification event sent from the PartyKit server to lobby clients.
 * Does not include lobby data — clients re-fetch from Next.js on receipt.
 */
export interface LobbySocketEvent {
  type: "lobby_updated";
  reason: LobbyChangeReason;
}
