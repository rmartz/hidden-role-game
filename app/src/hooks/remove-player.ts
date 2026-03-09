"use client";

import { useMutation } from "@tanstack/react-query";
import { removePlayer } from "@/lib/api";
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
