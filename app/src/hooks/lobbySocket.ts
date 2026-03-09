"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getPlayerId, getSessionId } from "@/lib/api";
import type { LobbySocketEvent } from "@/server/models/websocket";

const RECONNECT_DELAY_MS = 3000;

/**
 * Connects to the lobby WebSocket and updates the React Query cache when
 * lobby state changes. Automatically reconnects on unexpected disconnection.
 * Returns whether the connection is active.
 */
export function useLobbyWebSocket(lobbyId: string): { isConnected: boolean } {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const sessionId = getSessionId();
    if (!sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/ws?lobbyId=${encodeURIComponent(lobbyId)}&sessionId=${encodeURIComponent(sessionId)}`;

    function connect() {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        if (!isMounted.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
      };

      ws.onerror = (event) => {
        console.error("[LobbyWebSocket] Connection error", event);
      };

      ws.onclose = (event) => {
        setIsConnected(false);

        // 4000/4001 are auth errors — don't retry.
        if (event.code === 4000 || event.code === 4001) {
          console.error(
            `[LobbyWebSocket] Closed with auth error (code ${String(event.code)}): ${event.reason}`,
          );
          return;
        }

        if (!isMounted.current) return;

        console.error(
          `[LobbyWebSocket] Connection closed (code ${String(event.code)}), reconnecting in ${String(RECONNECT_DELAY_MS)}ms…`,
        );
        reconnectTimer.current = setTimeout(() => {
          if (isMounted.current) connect();
        }, RECONNECT_DELAY_MS);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data as string) as LobbySocketEvent;

        // The owner is the source of truth for config — ignore echoed config
        // changes so local edits aren't overwritten by the server's echo.
        if (message.reason === "config_changed") {
          const myPlayerId = getPlayerId();
          const isOwner = message.lobby.ownerPlayerId === myPlayerId;
          if (isOwner) return;
        }

        queryClient.setQueryData(["lobby", lobbyId], message.lobby);
      };

      return ws;
    }

    const ws = connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current !== null) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      ws.close();
    };
  }, [lobbyId, queryClient]);

  return { isConnected };
}
