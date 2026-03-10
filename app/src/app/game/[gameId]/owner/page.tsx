"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import { useGameStateQuery, useAdvanceGame } from "@/hooks";
import OwnerStartCountdown from "../OwnerStartCountdown";
import PlayersRoleList from "../PlayersRoleList";
import GameRolesList from "../GameRolesList";

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
    if (gameState?.status.type !== GameStatus.Starting) {
      setRefetchInterval(undefined);
    }
  }, [gameState?.status.type]);

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
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Game Starting</h1>
          <OwnerStartCountdown
            durationSeconds={STARTING_DURATION_SECONDS}
            onStart={() => {
              advanceMutation.mutate();
            }}
          />
          <PlayersRoleList
            assignments={gameState.visibleRoleAssignments}
            teamLabels={teamLabels}
          />
          <GameRolesList roles={gameState.rolesInPlay ?? []} />
        </div>
      );
    }

    if (gameState.status.type === GameStatus.Playing) {
      return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Game In Progress</h1>
          <PlayersRoleList
            assignments={gameState.visibleRoleAssignments}
            teamLabels={teamLabels}
          />
          <GameRolesList roles={gameState.rolesInPlay ?? []} />
        </div>
      );
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
