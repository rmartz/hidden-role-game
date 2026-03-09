import type { PublicLobby } from "./lobby";

export enum LobbyChangeReason {
  PlayerJoined = "player_joined",
  PlayerLeft = "player_left",
  ConfigChanged = "config_changed",
  OwnerChanged = "owner_changed",
  GameStarted = "game_started",
}

export interface LobbySocketEvent {
  type: "lobby_updated";
  reason: LobbyChangeReason;
  lobby: PublicLobby;
}
