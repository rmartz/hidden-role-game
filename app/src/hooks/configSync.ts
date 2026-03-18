"use client";

import { useEffect, useMemo, useRef } from "react";
import { throttle } from "lodash";
import { useAppSelector } from "@/store";
import { selectRoleSlots } from "@/store/game-config-slice";
import { useUpdateLobbyConfig } from "./lobby";

const SYNC_INTERVAL_MS = 1000;

/**
 * Throttles game config changes from the Redux store to the server.
 * Only syncs when the owner makes user-initiated changes (syncVersion > 0).
 * Tracks whether the last sync was acknowledged by the server, and retries
 * any pending change when the WebSocket reconnects.
 * Returns a `flushAsync` function that resolves once the in-flight sync
 * is acknowledged, or immediately if there is no pending change.
 */
export function useConfigSync(
  lobbyId: string,
  isOwner: boolean,
  isConnected: boolean,
): { flushAsync: () => Promise<void> } {
  const gameConfig = useAppSelector((s) => s.gameConfig);
  const syncVersion = useAppSelector((s) => s.gameConfig.syncVersion);
  const updateConfig = useUpdateLobbyConfig(lobbyId);

  // Keep refs so the throttled function always reads fresh values without
  // needing to be recreated.
  const gameConfigRef = useRef(gameConfig);
  const mutateRef = useRef(updateConfig.mutate);
  // True when there are owner-initiated changes not yet acknowledged by the server.
  const hasPendingChangeRef = useRef(false);
  // Resolvers waiting for the next sync to settle (success or error).
  const pendingFlushResolversRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    gameConfigRef.current = gameConfig;
  });
  useEffect(() => {
    mutateRef.current = updateConfig.mutate;
  });

  const throttledSync = useMemo(
    () =>
      throttle(
        () => {
          const {
            gameMode,
            roleConfigMode,
            showConfigToPlayers,
            showRolesInPlay,
            timerConfig,
            nominationEnabled,
          } = gameConfigRef.current;
          const roleSlots = selectRoleSlots(gameConfigRef.current);
          const drainResolvers = () => {
            const resolvers = pendingFlushResolversRef.current.splice(0);
            resolvers.forEach((r) => { r(); });
          };
          mutateRef.current(
            {
              gameMode,
              roleConfigMode,
              showConfigToPlayers,
              showRolesInPlay,
              roleSlots,
              timerConfig,
              nominationThreshold: nominationEnabled ? 2 : undefined,
            },
            {
              onSuccess: () => {
                hasPendingChangeRef.current = false;
                drainResolvers();
              },
              onError: () => {
                drainResolvers();
              },
            },
          );
        },
        SYNC_INTERVAL_MS,
        { leading: true, trailing: true },
      ),
    [],
  );

  useEffect(() => {
    if (!isOwner || syncVersion === 0) return;
    hasPendingChangeRef.current = true;
    throttledSync();
  }, [syncVersion, isOwner, throttledSync]);

  // On reconnect, flush any pending change that wasn't acknowledged.
  const prevIsConnectedRef = useRef(isConnected);
  useEffect(() => {
    const wasConnected = prevIsConnectedRef.current;
    prevIsConnectedRef.current = isConnected;
    if (
      isConnected &&
      !wasConnected &&
      isOwner &&
      hasPendingChangeRef.current
    ) {
      throttledSync.flush();
    }
  }, [isConnected, isOwner, throttledSync]);

  return {
    flushAsync: (): Promise<void> => {
      if (!hasPendingChangeRef.current) return Promise.resolve();
      return new Promise((resolve) => {
        pendingFlushResolversRef.current.push(resolve);
        throttledSync.flush();
      });
    },
  };
}
