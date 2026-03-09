"use client";

import { useEffect, useMemo, useRef } from "react";
import { throttle } from "lodash";
import { useAppSelector } from "@/store";
import { useUpdateLobbyConfig } from "./lobby";

const SYNC_INTERVAL_MS = 1000;

/**
 * Throttles game config changes from the Redux store to the server.
 * Only syncs when the owner makes user-initiated changes (syncVersion > 0).
 * Returns a `flush` function to send any pending update immediately.
 */
export function useConfigSync(
  lobbyId: string,
  isOwner: boolean,
): { flush: () => void } {
  const gameConfig = useAppSelector((s) => s.gameConfig);
  const syncVersion = useAppSelector((s) => s.gameConfig.syncVersion);
  const updateConfig = useUpdateLobbyConfig(lobbyId);

  // Keep refs so the throttled function always reads fresh values without
  // needing to be recreated.
  const gameConfigRef = useRef(gameConfig);
  const mutateRef = useRef(updateConfig.mutate);

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
          const { gameMode, roleCounts, showConfigToPlayers, showRolesInPlay } =
            gameConfigRef.current;
          mutateRef.current({
            gameMode,
            showConfigToPlayers,
            showRolesInPlay,
            roleSlots: Object.entries(roleCounts)
              .filter(([, count]) => count > 0)
              .map(([roleId, count]) => ({ roleId, count })),
          });
        },
        SYNC_INTERVAL_MS,
        { leading: true, trailing: true },
      ),
    [],
  );

  useEffect(() => {
    if (!isOwner || syncVersion === 0) return;
    throttledSync();
  }, [syncVersion, isOwner, throttledSync]);

  return {
    flush: () => {
      throttledSync.flush();
    },
  };
}
