"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import PartySocket from "partysocket";
import { getPlayerId } from "@/lib/api";
import { LobbyChangeReason } from "@/server/types/websocket";
import type { LobbySocketEvent } from "@/server/types/websocket";
import type { PublicLobby } from "@/server/types";

const PARTYKIT_HOST =
  process.env["NEXT_PUBLIC_PARTYKIT_HOST"] ?? "localhost:1999";

/**
 * Connects to the PartyKit lobby room and invalidates the React Query cache
 * when the server notifies us of lobby changes. PartySocket handles
 * reconnection automatically. Returns whether the connection is active.
 */
export function useLobbyWebSocket(
  lobbyId: string,
  sessionId: string | null,
): { isConnected: boolean } {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      party: "lobby",
      room: lobbyId,
    });

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    socket.onerror = (event) => {
      console.error("[LobbySocket] Connection error", event);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as LobbySocketEvent;

      // The owner is the source of truth for config — skip re-fetching so
      // local edits aren't overwritten by the server's echo.
      if (message.reason === LobbyChangeReason.ConfigChanged) {
        const cachedLobby = queryClient.getQueryData<PublicLobby>([
          "lobby",
          lobbyId,
        ]);
        const myPlayerId = getPlayerId();
        if (cachedLobby?.ownerPlayerId === myPlayerId) return;
      }

      void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    };

    return () => {
      socket.close();
    };
  }, [lobbyId, sessionId, queryClient]);

  return { isConnected };
}
