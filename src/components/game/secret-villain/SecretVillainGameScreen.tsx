"use client";

import { useState } from "react";
import type { PlayerGameState } from "@/server/types";
import { useGameAction, useReturnToLobby } from "@/hooks";
import { SecretVillainGameScreenView } from "./SecretVillainGameScreenView";

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
      isPending={action.isPending}
      isReturning={returnToLobby.isPending}
      returnError={returnToLobby.isError}
    />
  );
}
