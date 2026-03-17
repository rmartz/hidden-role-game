"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameMode, GameStatus } from "@/lib/types";
import { useGameStateQuery, GameModeContext } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";
import { parseGameMode } from "@/lib/game-modes";
import { GAME_PAGE_COPY } from "../copy";
import { UnsupportedGameMode } from "../UnsupportedGameMode";

const POLL_INTERVAL_MS = 2000;

export default function GameModePage() {
  const { gameId, gameMode: gameModeParam } = useParams<{
    gameId: string;
    gameMode: string;
  }>();
  const router = useRouter();

  const [refetchInterval, setRefetchInterval] = useState<number | undefined>(
    POLL_INTERVAL_MS,
  );

  const validatedGameMode = parseGameMode(gameModeParam);

  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, validatedGameMode, refetchInterval);

  const gameStatus = gameState?.status.type;
  const actualGameMode = gameState?.gameMode;

  useEffect(() => {
    if (!validatedGameMode) {
      router.push("/");
    }
  }, [validatedGameMode, router]);

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
    if (
      actualGameMode &&
      validatedGameMode &&
      actualGameMode !== validatedGameMode
    ) {
      router.replace(`/${actualGameMode}/game/${gameId}`);
    }
  }, [gameId, actualGameMode, validatedGameMode, router]);

  if (!validatedGameMode) return null;

  let gameScreen = null;
  if (gameState) {
    switch (validatedGameMode) {
      case GameMode.Werewolf:
        gameScreen = (
          <WerewolfGameScreen gameId={gameId} gameState={gameState} />
        );
        break;
      default:
        gameScreen = <UnsupportedGameMode />;
    }
  }

  const loadingMessage = isLoading ? (
    <p className="text-muted-foreground">{GAME_PAGE_COPY.loading}</p>
  ) : null;
  const errorMessage =
    error && error.message !== "401" && error.message !== "403" ? (
      <p className="text-destructive text-sm">
        {GAME_PAGE_COPY.errorPrefix}
        {error.message}
      </p>
    ) : null;
  const loadingView = (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">{GAME_PAGE_COPY.title}</h1>
      {loadingMessage}
      {errorMessage}
    </div>
  );

  const content = gameScreen ?? loadingView;

  return (
    <GameModeContext.Provider value={validatedGameMode}>
      {content}
    </GameModeContext.Provider>
  );
}
