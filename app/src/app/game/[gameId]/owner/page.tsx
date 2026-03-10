"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import { useGameStateQuery, useAdvanceGame } from "@/hooks";
import OwnerStartingScreen from "../OwnerStartingScreen";
import OwnerGameScreen from "../OwnerGameScreen";

const STARTING_DURATION_SECONDS = 10;
const POLL_INTERVAL_MS = 2000;

export default function GameOwnerPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const router = useRouter();

  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    POLL_INTERVAL_MS,
  );

  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, refetchInterval);

  const advanceMutation = useAdvanceGame(gameId);

  // Stop polling once out of Starting.
  useEffect(() => {
    if (gameState && gameState.status.type !== GameStatus.Starting) {
      setRefetchInterval(undefined);
    }
  }, [gameState]);

  useEffect(() => {
    if (error?.message === "401" || error?.message === "403") {
      router.push("/");
    }
  }, [error, router]);

  // Regular players don't belong on this route.
  useEffect(() => {
    if (gameState && !gameState.gameOwner) {
      router.replace(`/game/${gameId}`);
    }
  }, [gameState, gameId, router]);

  const teamLabels = gameState
    ? GAME_MODES[gameState.gameMode].teamLabels
    : undefined;

  if (gameState?.gameOwner) {
    if (gameState.status.type === GameStatus.Starting) {
      return (
        <OwnerStartingScreen
          gameState={gameState}
          teamLabels={teamLabels}
          durationSeconds={STARTING_DURATION_SECONDS}
          onStart={() => {
            advanceMutation.mutate();
          }}
        />
      );
    }

    if (gameState.status.type === GameStatus.Playing) {
      return <OwnerGameScreen gameState={gameState} teamLabels={teamLabels} />;
    }
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Hidden Role Game</h1>

      {isLoading && <p>Loading…</p>}

      {error && error.message !== "401" && error.message !== "403" && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
