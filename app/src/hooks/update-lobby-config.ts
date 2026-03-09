"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLobbyConfig } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { UpdateLobbyConfigRequest } from "@/server/models";

export function useUpdateLobbyConfig(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: UpdateLobbyConfigRequest) =>
      updateLobbyConfig(lobbyId, config),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      queryClient.setQueryData(["lobby", lobbyId], response.data.lobby);
    },
  });
}
