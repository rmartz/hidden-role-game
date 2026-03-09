"use client";

import { useMutation } from "@tanstack/react-query";
import { removePlayer, clearSession, joinLobby } from "@/lib/api";

export function useLeaveAndJoinLobby(onSuccess: () => void) {
  return useMutation({
    mutationFn: async ({
      storedLobbyId,
      myPlayerId,
      lobbyId,
      playerName,
    }: {
      storedLobbyId: string;
      myPlayerId: string;
      lobbyId: string;
      playerName: string;
    }) => {
      await removePlayer(storedLobbyId, myPlayerId);
      clearSession();
      await joinLobby(lobbyId, playerName);
    },
    onSuccess,
  });
}
