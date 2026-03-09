"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removePlayer, transferOwner } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

export function useRemovePlayer(
  lobbyId: string,
  onSuccess: (targetPlayerId: string) => void,
) {
  return useMutation({
    mutationFn: (targetPlayerId: string) =>
      removePlayer(lobbyId, targetPlayerId),
    onSuccess: (response, targetPlayerId) => {
      if (response.status === ServerResponseStatus.Error) return;
      onSuccess(targetPlayerId);
    },
  });
}

export function useTransferOwner(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetPlayerId: string) =>
      transferOwner(lobbyId, targetPlayerId),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });
}
