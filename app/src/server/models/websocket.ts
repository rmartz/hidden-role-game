import type { PublicLobby } from "./lobby";

export type LobbyChangeReason =
  | "player_joined"
  | "player_left"
  | "config_changed"
  | "owner_changed"
  | "game_started";

export interface LobbySocketEvent {
  type: "lobby_updated";
  reason: LobbyChangeReason;
  lobby: PublicLobby;
}
