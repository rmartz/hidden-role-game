"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ref, onValue } from "firebase/database";
import { getClientDatabase } from "@/lib/firebase/client";
import {
  startGame,
  advanceGame,
  applyGameAction,
  getGameState,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/types";
import type { PlayerGameState, ServerResponse } from "@/server/types";
import type { Game, GameMode } from "@/lib/types";
import {
  firebaseToPlayerState,
  type FirebasePlayerState,
} from "@/lib/firebase/schema";
import { getSessionId } from "@/lib/api";
import { useFirebaseAuth } from "@/hooks/firebaseAuth";
import { useGameModeContext } from "@/hooks/gameModeContext";

export function useStartGame(lobbyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gameMode }: { gameMode: GameMode }) =>
      startGame(lobbyId, gameMode),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    },
  });
}

/**
 * Subscribes to the player's own pre-computed game state in Firebase RTDB,
 * updating the TanStack Query cache directly for real-time updates without polling.
 * Falls back to HTTP fetch for the initial load while Firebase connects.
 */
export function useGameStateQuery(
  gameId: string,
  gameMode: GameMode | undefined,
  refetchInterval?: number,
) {
  const queryClient = useQueryClient();
  const { isReady } = useFirebaseAuth();

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId || !isReady) return;

    const db = getClientDatabase();
    const stateRef = ref(db, `games/${gameId}/playerState/${sessionId}`);

    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const state = firebaseToPlayerState(
          snapshot.val() as FirebasePlayerState,
        );
        queryClient.setQueryData<PlayerGameState>(["game", gameId], state);
      },
      (error) => {
        console.error("[FirebaseGameState] Subscription error", error);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [gameId, isReady, queryClient]);

  return useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => {
      if (!gameMode) throw new Error("Game mode not available");
      const { data, httpStatus } = await getGameState(gameId, gameMode);
      if (httpStatus === 401 || httpStatus === 403)
        throw new Error(String(httpStatus));
      if (data.status === ServerResponseStatus.Error)
        throw new Error(data.error);
      return data.data;
    },
    enabled: !!gameMode,
    retry: false,
    refetchInterval,
  });
}

export function useAllPlayersGameStates(
  gameId: string,
  gameMode: GameMode,
  players: readonly { sessionId: string }[],
  enabled: boolean,
): Map<string, PlayerGameState> {
  const results = useQueries({
    queries: players.map(({ sessionId }) => ({
      queryKey: ["game", gameId, sessionId] as const,
      queryFn: async () => {
        const response = await fetch(`/api/${gameMode}/game/${gameId}`, {
          headers: { "x-session-id": sessionId },
        });
        const data = (await response.json()) as ServerResponse<PlayerGameState>;
        if (data.status === ServerResponseStatus.Error)
          throw new Error(data.error);
        return data.data;
      },
      enabled,
      refetchInterval: enabled ? 2000 : false,
    })),
  });

  return new Map(
    players.flatMap(({ sessionId }, i) => {
      const data = results[i]?.data;
      return data ? ([[sessionId, data]] as [string, PlayerGameState][]) : [];
    }),
  );
}

export function useDebugFullGameState(gameId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["debug-full-game", gameId] as const,
    queryFn: async () => {
      const response = await fetch(`/api/debug/game/${gameId}`);
      const data = (await response.json()) as ServerResponse<Game>;
      if (data.status === ServerResponseStatus.Error)
        throw new Error(data.error);
      return data.data;
    },
    enabled,
    refetchInterval: enabled ? 2000 : false,
  });
}

export function useAdvanceGame(gameId: string) {
  const queryClient = useQueryClient();
  const gameMode = useGameModeContext();
  return useMutation({
    mutationFn: () => advanceGame(gameId, gameMode),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["game", gameId] });
    },
  });
}

export function useGameAction(gameId: string) {
  const queryClient = useQueryClient();
  const gameMode = useGameModeContext();
  return useMutation({
    mutationFn: ({
      actionId,
      payload,
    }: {
      actionId: string;
      payload?: unknown;
    }) => applyGameAction(gameId, gameMode, actionId, payload),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["game", gameId] });
    },
  });
}
