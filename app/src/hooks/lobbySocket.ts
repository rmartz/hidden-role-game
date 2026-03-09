"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSessionId } from "@/lib/api";
import type { LobbySocketEvent } from "@/server/models/websocket";

/**
 * Connects to the lobby WebSocket and updates the React Query cache when
 * lobby state changes. Returns whether the connection is active.
 */
export function useLobbyWebSocket(lobbyId: string): { isConnected: boolean } {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/ws?lobbyId=${encodeURIComponent(lobbyId)}&sessionId=${encodeURIComponent(sessionId)}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as LobbySocketEvent;
      queryClient.setQueryData(["lobby", lobbyId], message.lobby);
    };

    return () => {
      ws.close();
    };
  }, [lobbyId, queryClient]);

  return { isConnected };
}
