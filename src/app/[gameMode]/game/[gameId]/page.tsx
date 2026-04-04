"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GameMode } from "@/lib/types";
import { useGameStateQuery, GameModeContext } from "@/hooks";
import { WerewolfGameScreen } from "@/components/game";
import { SecretVillainGameScreen } from "@/components/game/secret-villain";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { parseGameMode } from "@/lib/game-modes";
import { GAME_PAGE_COPY } from "./page.copy";
import { UnsupportedGameMode } from "../UnsupportedGameMode";

export default function GameModePage() {
  const { gameId, gameMode: gameModeParam } = useParams<{
    gameId: string;
    gameMode: string;
  }>();
  const router = useRouter();

  const validatedGameMode = parseGameMode(gameModeParam);

  const {
    data: gameState,
    isLoading,
    error,
  } = useGameStateQuery(gameId, validatedGameMode);

  const actualGameMode = gameState?.gameMode;

  useEffect(() => {
    if (!validatedGameMode) {
      router.push("/");
    }
  }, [validatedGameMode, router]);

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

  return (
    <GameModeContext.Provider value={validatedGameMode}>
      {gameState ? (
        <>
          {validatedGameMode === GameMode.Werewolf ? (
            <WerewolfGameScreen
              gameId={gameId}
              gameState={gameState as WerewolfPlayerGameState}
            />
          ) : validatedGameMode === GameMode.SecretVillain ? (
            <SecretVillainGameScreen gameId={gameId} gameState={gameState} />
          ) : (
            <UnsupportedGameMode />
          )}
        </>
      ) : (
        // Loading
        <div className="p-5 max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-4">{GAME_PAGE_COPY.title}</h1>
          {isLoading && (
            <p className="text-muted-foreground">{GAME_PAGE_COPY.loading}</p>
          )}
          {error && error.message !== "401" && error.message !== "403" && (
            <p className="text-destructive text-sm">
              {GAME_PAGE_COPY.errorPrefix}
              {error.message}
            </p>
          )}
        </div>
      )}
    </GameModeContext.Provider>
  );
}
