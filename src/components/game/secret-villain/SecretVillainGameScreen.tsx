"use client";

import { useEffect, useState } from "react";
import { GameStatus } from "@/lib/types";
import type { StartingGameStatus } from "@/lib/types";
import type { PlayerGameState } from "@/server/types";
import { useGameAction, useReturnToLobby } from "@/hooks";
import { SecretVillainGameScreenView } from "./SecretVillainGameScreenView";

/** How long the Starting phase lasts before auto-advancing to Playing (seconds). */
const STARTING_DURATION_SECONDS = 15;

interface SecretVillainGameScreenProps {
  gameState: PlayerGameState;
  gameId: string;
}

export function SecretVillainGameScreen({
  gameState,
  gameId,
}: SecretVillainGameScreenProps) {
  const action = useGameAction(gameId);
  const returnToLobby = useReturnToLobby(gameState.lobbyId);

  const [selectedChancellorId, setSelectedChancellorId] = useState<
    string | undefined
  >();
  const [selectedCardIndex, setSelectedCardIndex] = useState<
    number | undefined
  >();
  const [selectedTargetId, setSelectedTargetId] = useState<
    string | undefined
  >();

  // Starting phase countdown.
  const isStarting = gameState.status.type === GameStatus.Starting;
  const startedAt = isStarting
    ? (gameState.status as StartingGameStatus).startedAt
    : undefined;
  const [startingSecondsRemaining, setStartingSecondsRemaining] = useState<
    number | undefined
  >();

  useEffect(() => {
    if (!isStarting || !startedAt) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, STARTING_DURATION_SECONDS - elapsed);
      setStartingSecondsRemaining(remaining);

      if (remaining <= 0) {
        action.mutate({ actionId: "advance-game" });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isStarting, startedAt, action]);

  return (
    <SecretVillainGameScreenView
      gameState={gameState}
      selectedChancellorId={selectedChancellorId}
      onSelectChancellor={setSelectedChancellorId}
      onConfirmNomination={() => {
        if (selectedChancellorId) {
          action.mutate({
            actionId: "nominate-chancellor",
            payload: { targetPlayerId: selectedChancellorId },
          });
          setSelectedChancellorId(undefined);
        }
      }}
      onVote={(vote) => {
        action.mutate({ actionId: "cast-election-vote", payload: { vote } });
      }}
      selectedCardIndex={selectedCardIndex}
      onSelectCard={setSelectedCardIndex}
      onDiscardCard={() => {
        if (selectedCardIndex !== undefined) {
          action.mutate({
            actionId: "president-discard",
            payload: { cardIndex: selectedCardIndex },
          });
          setSelectedCardIndex(undefined);
        }
      }}
      onPlayCard={() => {
        if (selectedCardIndex !== undefined) {
          action.mutate({
            actionId: "chancellor-play",
            payload: { cardIndex: selectedCardIndex },
          });
          setSelectedCardIndex(undefined);
        }
      }}
      onProposeVeto={() => {
        action.mutate({ actionId: "propose-veto" });
      }}
      onAcceptVeto={() => {
        action.mutate({
          actionId: "veto-response",
          payload: { accept: true },
        });
      }}
      onRejectVeto={() => {
        action.mutate({
          actionId: "veto-response",
          payload: { accept: false },
        });
      }}
      selectedTargetId={selectedTargetId}
      onSelectTarget={setSelectedTargetId}
      onConfirmAction={() => {
        if (selectedTargetId) {
          action.mutate({
            actionId: "special-action",
            payload: { targetPlayerId: selectedTargetId },
          });
          setSelectedTargetId(undefined);
        }
      }}
      onConsent={() => {
        action.mutate({ actionId: "investigation-consent" });
      }}
      onReturnToLobby={() => {
        returnToLobby.mutate();
      }}
      startingSecondsRemaining={startingSecondsRemaining}
      isPending={action.isPending}
      isReturning={returnToLobby.isPending}
      returnError={returnToLobby.isError}
    />
  );
}
