/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CreateLobbyRequest } from "../models/CreateLobbyRequest";
import type { JoinLobbyRequest } from "../models/JoinLobbyRequest";
import type { ServerResponse_LobbyJoinResponse_ } from "../models/ServerResponse_LobbyJoinResponse_";
import type { ServerResponse_PublicLobby_ } from "../models/ServerResponse_PublicLobby_";
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
export class DefaultService {
  /**
   * Create a new lobby. The requesting player becomes the first player and owner.
   * @param requestBody
   * @returns ServerResponse_LobbyJoinResponse_ Created lobby plus the owner's session ID
   * @throws ApiError
   */
  public static createLobby(
    requestBody: CreateLobbyRequest,
  ): CancelablePromise<ServerResponse_LobbyJoinResponse_> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/lobby/create",
      body: requestBody,
      mediaType: "application/json",
      errors: {
        500: `Server error`,
      },
    });
  }
  /**
   * Get a lobby by ID. Requires a valid x-session-id header.
   * @param lobbyId The lobby ID
   * @param xSessionId
   * @returns ServerResponse_PublicLobby_ The lobby (no session IDs exposed)
   * @throws ApiError
   */
  public static getLobby(
    lobbyId: string,
    xSessionId?: string,
  ): CancelablePromise<ServerResponse_PublicLobby_> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/lobby/{lobbyId}",
      path: {
        lobbyId: lobbyId,
      },
      headers: {
        "x-session-id": xSessionId,
      },
      errors: {
        404: `Lobby not found`,
      },
    });
  }
  /**
   * Join a lobby
   * @param lobbyId The lobby ID
   * @param requestBody Player name
   * @returns ServerResponse_LobbyJoinResponse_ Updated lobby with new player, plus that player's session ID
   * @throws ApiError
   */
  public static joinLobby(
    lobbyId: string,
    requestBody: JoinLobbyRequest,
  ): CancelablePromise<ServerResponse_LobbyJoinResponse_> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/lobby/{lobbyId}/join",
      path: {
        lobbyId: lobbyId,
      },
      body: requestBody,
      mediaType: "application/json",
      errors: {
        404: `Lobby not found`,
      },
    });
  }
}
