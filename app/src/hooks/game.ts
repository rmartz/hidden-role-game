"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startGame, getGameState } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/server/models";

export function useStartGame(lobbyId: string) {
  const queryClient = useQueryClient();
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
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });
}

export function useGameStateQuery(gameId: string) {
  return useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      const { data, httpStatus } = await getGameState(gameId);
      if (httpStatus === 401 || httpStatus === 403)
        throw new Error(String(httpStatus));
      if (data.status === ServerResponseStatus.Error)
        throw new Error(data.error);
      return data.data;
    },
    retry: false,
  });
}
