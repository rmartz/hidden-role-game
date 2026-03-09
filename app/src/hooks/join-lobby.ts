"use client";

import { useMutation } from "@tanstack/react-query";
import { joinLobby } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { LobbyJoinResponse } from "@/server/models";

export function useJoinLobby(onSuccess: (data: LobbyJoinResponse) => void) {
  return useMutation({
    mutationFn: async ({
      lobbyId,
      playerName,
    }: {
      lobbyId: string;
      playerName: string;
    }) => {
      const response = await joinLobby(lobbyId, playerName);
      if (response.status === ServerResponseStatus.Error)
        throw new Error(response.error);
      return response.data;
    },
    onSuccess,
  });
}
