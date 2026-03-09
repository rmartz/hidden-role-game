"use client";

import { useMutation } from "@tanstack/react-query";
import { transferOwner } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

export function useTransferOwner(lobbyId: string, onSuccess: () => void) {
  return useMutation({
    mutationFn: (targetPlayerId: string) =>
      transferOwner(lobbyId, targetPlayerId),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      onSuccess();
    },
  });
}
