"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createLobby } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

export function useCreateLobby() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (playerName: string) => {
      const response = await createLobby(playerName);
      if (response.status === ServerResponseStatus.Error)
        throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/lobby/${data.lobby.id}`);
    },
  });
}
