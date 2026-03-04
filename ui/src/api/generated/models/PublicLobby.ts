/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { GameStatusState } from "./GameStatusState";
import type { PublicLobbyPlayer } from "./PublicLobbyPlayer";
export type PublicLobby = {
  id: string;
  players: Array<PublicLobbyPlayer>;
  game?: {
    players: Array<PublicLobbyPlayer>;
    status: GameStatusState;
  };
};
