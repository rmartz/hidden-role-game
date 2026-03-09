"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameStatus } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import { useGameStateQuery, useAdvanceGame } from "@/hooks";

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

  // Informational countdown; auto-advance when it reaches 0.
  const [secondsLeft, setSecondsLeft] = useState(STARTING_DURATION_SECONDS);
  const hasAdvancedRef = useRef(false);
  const advanceMutateRef = useRef(advanceMutation.mutate);
  useEffect(() => {
    advanceMutateRef.current = advanceMutation.mutate;
  });

  useEffect(() => {
    if (gameState?.status.type !== GameStatus.Starting) return;
    if (secondsLeft <= 0) {
      if (!hasAdvancedRef.current) {
        hasAdvancedRef.current = true;
        advanceMutateRef.current();
      }
      return;
    }
    const timer = setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [secondsLeft, gameState?.status.type]);

  const teamLabels = gameState
    ? GAME_MODES[gameState.gameMode].teamLabels
    : undefined;

  if (gameState?.gameOwner) {
    if (gameState.status.type === GameStatus.Starting) {
      return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Game Starting</h1>
          <p>
            Players are reading their roles.{" "}
            {secondsLeft > 0 ? (
              <>
                Starting in <strong>{secondsLeft}</strong> second
                {secondsLeft !== 1 ? "s" : ""}…
              </>
            ) : (
              "Advancing…"
            )}
          </p>

          {gameState.visibleRoleAssignments.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>Player Roles</h2>
              <ul>
                {gameState.visibleRoleAssignments.map((t) => (
                  <li key={t.player.id}>
                    {t.player.name} — {t.role.name} (
                    {teamLabels?.[t.role.team] ?? t.role.team})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {gameState.rolesInPlay && gameState.rolesInPlay.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>Roles In Play</h2>
              <ul>
                {gameState.rolesInPlay.map((r) => (
                  <li key={r.id}>
                    {r.name} — {r.team}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (gameState.status.type === GameStatus.Playing) {
      return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
          <h1>Game In Progress</h1>

          {gameState.visibleRoleAssignments.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>Player Roles</h2>
              <ul>
                {gameState.visibleRoleAssignments.map((t) => (
                  <li key={t.player.id}>
                    {t.player.name} — {t.role.name} (
                    {teamLabels?.[t.role.team] ?? t.role.team})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {gameState.rolesInPlay && gameState.rolesInPlay.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h2>Roles In Play</h2>
              <ul>
                {gameState.rolesInPlay.map((r) => (
                  <li key={r.id}>
                    {r.name} — {r.team}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
