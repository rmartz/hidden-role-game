"use client";

import { throttle } from "lodash";
import { useEffect, useEffectEvent, useMemo, useRef } from "react";

import { useAppSelector } from "@/store";
import { selectRoleBuckets } from "@/store/game-config-slice";

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

  // True when there are owner-initiated changes not yet acknowledged by the server.
  const hasPendingChangeRef = useRef(false);
  // Resolvers waiting for the next sync to settle (success or error).
  const pendingFlushResolversRef = useRef<(() => void)[]>([]);

  // Sends the current config. An Effect Event, so it always reads the latest
  // config and mutation without the throttled wrapper being recreated.
  const sync = useEffectEvent(() => {
    const {
      gameMode,
      roleConfigMode,
      showConfigToPlayers,
      showRolesInPlay,
      timerConfig,
      modeConfig,
    } = gameConfig;
    const roleBuckets = selectRoleBuckets(gameConfig);
    const drainResolvers = () => {
      const resolvers = pendingFlushResolversRef.current.splice(0);
      resolvers.forEach((r) => {
        r();
      });
    };
    updateConfig.mutate(
      {
        gameMode,
        roleConfigMode,
        showConfigToPlayers,
        showRolesInPlay,
        roleBuckets,
        timerConfig,
        modeConfig,
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
  });

  // Throttles whatever send it is handed; the effects below hand it `sync`.
  const throttledSync = useMemo(
    () =>
      throttle(
        (send: () => void) => {
          send();
        },
        SYNC_INTERVAL_MS,
        { leading: true, trailing: true },
      ),
    [],
  );

  useEffect(() => {
    if (!isOwner || syncVersion === 0) return;
    hasPendingChangeRef.current = true;
    throttledSync(() => {
      sync();
    });
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
