"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ref, onValue } from "firebase/database";
import { getClientDatabase } from "@/lib/firebase/client";
import type { PublicLobby } from "@/server/types";
import type { FirebaseLobbyPublic } from "@/lib/firebase/schema";
import { firebaseToPublicLobby } from "@/lib/firebase/schema";
import { getPlayerId } from "@/lib/api";
import { useFirebaseAuth } from "@/hooks/firebaseAuth";

/**
 * Subscribes to the lobby's public Firebase RTDB node and updates the
 * TanStack Query cache directly, providing real-time lobby updates without
 * HTTP polling.
 */
export function useLobbyWebSocket(
  lobbyId: string,
  sessionId?: string,
): { isConnected: boolean } {
  const queryClient = useQueryClient();
  const isActive = useRef(false);
  const { isReady } = useFirebaseAuth();

  useEffect(() => {
    if (!sessionId || !isReady) return;

    const db = getClientDatabase();
    const lobbyPublicRef = ref(db, `lobbies/${lobbyId}/public`);
    isActive.current = true;

    const unsubscribe = onValue(
      lobbyPublicRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const raw = snapshot.val() as FirebaseLobbyPublic;
        const lobby = firebaseToPublicLobby(lobbyId, raw);

        const myPlayerId = getPlayerId();
        const isOwner = lobby.ownerPlayerId === myPlayerId;

        // The owner is the source of truth for config — skip updates that
        // only reflect config changes so local edits aren't overwritten.
        const cached = queryClient.getQueryData<PublicLobby>([
          "lobby",
          lobbyId,
        ]);
        if (isOwner && cached) {
          const sameStructure =
            JSON.stringify(cached.players) === JSON.stringify(lobby.players) &&
            cached.gameId === lobby.gameId &&
            cached.ownerPlayerId === lobby.ownerPlayerId &&
            JSON.stringify(cached.readyPlayerIds) ===
              JSON.stringify(lobby.readyPlayerIds) &&
            cached.countdownStartedAt === lobby.countdownStartedAt;
          if (sameStructure) return;
        }

        queryClient.setQueryData(["lobby", lobbyId], lobby);
      },
      (error) => {
        console.error("[FirebaseLobbySocket] Subscription error", error);
      },
    );

    return () => {
      isActive.current = false;
      unsubscribe();
    };
  }, [lobbyId, sessionId, isReady, queryClient]);

  return { isConnected: !!sessionId };
}
