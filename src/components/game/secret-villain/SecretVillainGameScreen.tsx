"use client";

import { useEffect, useRef, useState } from "react";
import { GameStatus } from "@/lib/types";
import type { StartingGameStatus } from "@/lib/types";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import { useAdvanceGame, useGameAction, useReturnToLobby } from "@/hooks";
import { SecretVillainAction } from "@/lib/game/modes/secret-villain/actions";
import { SpecialActionType } from "@/lib/game/modes/secret-villain/types";
import { SecretVillainGameScreenView } from "./SecretVillainGameScreenView";

/** How long the Starting phase lasts before auto-advancing to Playing (seconds). */
const STARTING_DURATION_SECONDS = 15;

interface SecretVillainGameScreenProps {
  gameState: SecretVillainPlayerGameState;
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
  const advanceGame = useAdvanceGame(gameId);
  const isStarting = gameState.status.type === GameStatus.Starting;
  const startedAt = isStarting
    ? (gameState.status as StartingGameStatus).startedAt
    : undefined;
  const [startingSecondsRemaining, setStartingSecondsRemaining] = useState<
    number | undefined
  >();
  const hasAdvancedRef = useRef(false);

  useEffect(() => {
    if (!isStarting || !startedAt) {
      hasAdvancedRef.current = false;
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, STARTING_DURATION_SECONDS - elapsed);
      setStartingSecondsRemaining(remaining);

      if (remaining <= 0 && !hasAdvancedRef.current) {
        hasAdvancedRef.current = true;
        advanceGame.mutate();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isStarting, startedAt, advanceGame]);

  return (
    <SecretVillainGameScreenView
      gameState={gameState}
      selectedChancellorId={selectedChancellorId}
      onSelectChancellor={setSelectedChancellorId}
      onConfirmNomination={() => {
        if (selectedChancellorId) {
          action.mutate({
            actionId: SecretVillainAction.NominateChancellor,
            payload: { chancellorId: selectedChancellorId },
          });
          setSelectedChancellorId(undefined);
        }
      }}
      onVote={(vote) => {
        action.mutate({
          actionId: SecretVillainAction.CastElectionVote,
          payload: { vote },
        });
      }}
      onResolveElection={() => {
        action.mutate({ actionId: SecretVillainAction.ResolveElection });
      }}
      onDrawCards={() => {
        action.mutate({ actionId: SecretVillainAction.PresidentDraw });
      }}
      selectedCardIndex={selectedCardIndex}
      onSelectCard={setSelectedCardIndex}
      onDiscardCard={() => {
        if (selectedCardIndex !== undefined) {
          action.mutate({
            actionId: SecretVillainAction.PresidentDiscard,
            payload: { cardIndex: selectedCardIndex },
          });
          setSelectedCardIndex(undefined);
        }
      }}
      onPlayCard={() => {
        if (selectedCardIndex !== undefined) {
          action.mutate({
            actionId: SecretVillainAction.ChancellorPlay,
            payload: { cardIndex: selectedCardIndex },
          });
          setSelectedCardIndex(undefined);
        }
      }}
      onProposeVeto={() => {
        action.mutate({ actionId: SecretVillainAction.ProposeVeto });
      }}
      onAcceptVeto={() => {
        action.mutate({
          actionId: SecretVillainAction.RespondVeto,
          payload: { consent: true },
        });
      }}
      onRejectVeto={() => {
        action.mutate({
          actionId: SecretVillainAction.RespondVeto,
          payload: { consent: false },
        });
      }}
      selectedTargetId={selectedTargetId}
      onSelectTarget={setSelectedTargetId}
      onConfirmAction={() => {
        if (selectedTargetId && gameState.svPhase?.actionType) {
          const specialActionMap: Record<string, SecretVillainAction> = {
            [SpecialActionType.InvestigateTeam]:
              SecretVillainAction.SelectInvestigationTarget,
            [SpecialActionType.SpecialElection]:
              SecretVillainAction.CallSpecialElection,
            [SpecialActionType.Shoot]: SecretVillainAction.ShootPlayer,
            [SpecialActionType.PolicyPeek]:
              SecretVillainAction.ResolvePolicyPeek,
          };
          const actionId = specialActionMap[gameState.svPhase.actionType];
          if (actionId) {
            action.mutate({
              actionId,
              payload: { targetPlayerId: selectedTargetId },
            });
            setSelectedTargetId(undefined);
          }
        }
      }}
      onResolveAction={() => {
        if (gameState.svPhase?.actionType) {
          const resolveMap: Partial<
            Record<SpecialActionType, SecretVillainAction>
          > = {
            [SpecialActionType.InvestigateTeam]:
              SecretVillainAction.ResolveInvestigation,
            [SpecialActionType.PolicyPeek]:
              SecretVillainAction.ResolvePolicyPeek,
          };
          const actionId = resolveMap[gameState.svPhase.actionType];
          if (actionId) {
            action.mutate({ actionId });
          }
        }
      }}
      onPeek={() => {
        action.mutate({ actionId: SecretVillainAction.PolicyPeek });
      }}
      onAdvanceFromElection={() => {
        action.mutate({
          actionId: SecretVillainAction.AdvanceFromElection,
        });
      }}
      onConsent={() => {
        action.mutate({
          actionId: SecretVillainAction.ConsentInvestigation,
        });
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
