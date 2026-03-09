"use client";

import { useQuery } from "@tanstack/react-query";
import { getGameState } from "@/lib/api";
import { ServerResponseStatus } from "@/server/models";

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
