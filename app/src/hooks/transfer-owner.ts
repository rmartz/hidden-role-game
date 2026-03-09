"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferOwner } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

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
