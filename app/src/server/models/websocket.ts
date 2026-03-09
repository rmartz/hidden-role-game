import type { PublicLobby } from "./lobby";

export interface LobbySocketEvent {
  type: "lobby_updated";
  lobby: PublicLobby;
}
