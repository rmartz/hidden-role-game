"use client";

import { useMutation } from "@tanstack/react-query";
import { startGame } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

export function useStartGame(lobbyId: string, onSuccess: () => void) {
  return useMutation({
    mutationFn: ({
      roleSlots,
      gameMode,
    }: {
      roleSlots: RoleSlot[];
      gameMode: GameMode;
    }) => startGame(lobbyId, roleSlots, gameMode),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      onSuccess();
    },
  });
}
