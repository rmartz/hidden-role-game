"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/types";
import { useGameStateQuery } from "@/hooks";

const POLL_INTERVAL_MS = 2000;

/**
 * Redirect page: fetches game state to determine the game mode, then replaces
 * the URL with the canonical `/game/[gameId]/[gameMode]` route. Handles the
 * Starting status by polling until the game mode is known.
 */
export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    POLL_INTERVAL_MS,
  );

  const { data: gameState, error } = useGameStateQuery(gameId, refetchInterval);

  const gameStatus = gameState?.status.type;
  const gameMode = gameState?.gameMode;

  useEffect(() => {
    if (gameStatus && gameStatus !== GameStatus.Starting) {
      setRefetchInterval(undefined);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  useEffect(() => {
    if (gameMode) {
      router.replace(`/game/${gameId}/${gameMode}`);
    }
  }, [gameId, gameMode, router]);

  return null;
}
