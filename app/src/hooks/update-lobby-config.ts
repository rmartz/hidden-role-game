"use client";

import { useMutation } from "@tanstack/react-query";
import { updateLobbyConfig } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";
import type { PublicLobby, UpdateLobbyConfigRequest } from "@/server/models";

export function useUpdateLobbyConfig(
  lobbyId: string,
  onSuccess: (lobby: PublicLobby) => void,
) {
  return useMutation({
    mutationFn: (config: UpdateLobbyConfigRequest) =>
      updateLobbyConfig(lobbyId, config),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      onSuccess(response.data.lobby);
    },
  });
}
