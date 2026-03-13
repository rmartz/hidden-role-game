"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ref, onValue } from "firebase/database";
import { getClientDatabase } from "@/lib/firebase/client";
import {
  startGame,
  advanceGame,
  applyGameAction,
  getGameState,
} from "@/lib/api";
import { ServerResponseStatus } from "@/server/types";
import type { PlayerGameState } from "@/server/types";
import type { GameMode } from "@/lib/types";
import type { RoleSlot } from "@/server/types";
import {
  firebaseToPlayerState,
  type FirebasePlayerState,
} from "@/lib/firebase/schema";
import { getSessionId } from "@/lib/api";
import { useFirebaseAuth } from "@/hooks/firebaseAuth";

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

/**
 * Subscribes to the player's own pre-computed game state in Firebase RTDB,
 * updating the TanStack Query cache directly for real-time updates without polling.
 * Falls back to HTTP fetch for the initial load while Firebase connects.
 */
export function useGameStateQuery(gameId: string, refetchInterval?: number) {
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
      const { data, httpStatus } = await getGameState(gameId);
      if (httpStatus === 401 || httpStatus === 403)
        throw new Error(String(httpStatus));
      if (data.status === ServerResponseStatus.Error)
        throw new Error(data.error);
      return data.data;
    },
    retry: false,
    refetchInterval,
  });
}

export function useAdvanceGame(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => advanceGame(gameId),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["game", gameId] });
    },
  });
}

export function useGameAction(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actionId,
      payload,
    }: {
      actionId: string;
      payload?: unknown;
    }) => applyGameAction(gameId, actionId, payload),
    onSuccess: (response) => {
      if (response.status === ServerResponseStatus.Error) return;
      void queryClient.invalidateQueries({ queryKey: ["game", gameId] });
    },
  });
}
