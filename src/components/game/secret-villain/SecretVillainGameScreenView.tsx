"use client";

import { GameStatus } from "@/lib/types";
import { SecretVillainPhase } from "@/lib/game-modes/secret-villain/types";
import { FAILED_ELECTION_THRESHOLD } from "@/lib/game-modes/secret-villain/types";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import type { PlayerGameState } from "@/server/types";
import { BoardDisplay } from "./BoardDisplay";
import { ElectionNominationView } from "./ElectionNominationView";
import { ElectionVoteView } from "./ElectionVoteView";
import { ElectionResultView } from "./ElectionResultView";
import { PolicyPresidentView } from "./PolicyPresidentView";
import { PolicyChancellorView } from "./PolicyChancellorView";
import { VetoPromptView } from "./VetoPromptView";
import { SpecialActionView } from "./SpecialActionView";
import { SecretVillainGameOverView } from "./SecretVillainGameOverView";

function getPlayerName(
  players: PlayerGameState["players"],
  playerId: string,
): string {
  return players.find((p) => p.id === playerId)?.name ?? playerId;
}

export interface SecretVillainGameScreenViewProps {
  gameState: PlayerGameState;
  // Election actions
  selectedChancellorId?: string;
  onSelectChancellor: (playerId: string) => void;
  onConfirmNomination: () => void;
  onVote: (vote: "aye" | "no") => void;
  // Policy actions
  selectedCardIndex?: number;
  onSelectCard: (index: number) => void;
  onDiscardCard: () => void;
  onPlayCard: () => void;
  // Veto actions
  onProposeVeto: () => void;
  onAcceptVeto: () => void;
  onRejectVeto: () => void;
  // Special action
  selectedTargetId?: string;
  onSelectTarget: (playerId: string) => void;
  onConfirmAction: () => void;
  onConsent: () => void;
  // Game over
  onReturnToLobby: () => void;
  // Shared
  isPending?: boolean;
  isReturning?: boolean;
  returnError?: boolean;
}

export function SecretVillainGameScreenView({
  gameState,
  selectedChancellorId,
  onSelectChancellor,
  onConfirmNomination,
  onVote,
  selectedCardIndex,
  onSelectCard,
  onDiscardCard,
  onPlayCard,
  onProposeVeto,
  onAcceptVeto,
  onRejectVeto,
  selectedTargetId,
  onSelectTarget,
  onConfirmAction,
  onConsent,
  onReturnToLobby,
  isPending,
  isReturning,
  returnError,
}: SecretVillainGameScreenViewProps) {
  if (gameState.status.type === GameStatus.Finished) {
    return (
      <SecretVillainGameOverView
        gameState={gameState}
        onReturnToLobby={onReturnToLobby}
        isReturning={isReturning}
        returnError={returnError}
      />
    );
  }

  const phase = gameState.svPhase;
  if (!phase) return null;

  const myPlayerId = gameState.myPlayerId ?? "";
  const isEliminated = gameState.amDead === true;
  const board = gameState.svBoard;
  const players = gameState.players;

  const boardSection = board ? (
    <BoardDisplay
      goodCardsPlayed={board.goodCardsPlayed}
      badCardsPlayed={board.badCardsPlayed}
      failedElectionCount={board.failedElectionCount}
      failedElectionThreshold={FAILED_ELECTION_THRESHOLD}
      vetoUnlocked={gameState.vetoUnlocked}
    />
  ) : null;

  const eliminatedOverlay = isEliminated ? (
    <p className="text-muted-foreground text-sm mb-4">
      {SECRET_VILLAIN_COPY.eliminated}
    </p>
  ) : null;

  const phaseContent = renderPhaseContent();

  return (
    <div className="p-5 max-w-lg mx-auto">
      {boardSection}
      {eliminatedOverlay}
      {phaseContent}
    </div>
  );

  function renderPhaseContent() {
    switch (phase?.type) {
      case SecretVillainPhase.ElectionNomination:
        return (
          <ElectionNominationView
            presidentName={getPlayerName(players, phase.presidentId)}
            eligiblePlayers={(gameState.eligibleChancellorIds ?? []).map(
              (id) => ({
                id,
                name: getPlayerName(players, id),
              }),
            )}
            selectedPlayerId={selectedChancellorId}
            onSelectPlayer={onSelectChancellor}
            onConfirm={onConfirmNomination}
            isPending={isPending}
            isPresident={phase.presidentId === myPlayerId}
          />
        );
      case SecretVillainPhase.ElectionVote: {
        if (gameState.electionPassed !== undefined) {
          return (
            <ElectionResultView
              presidentName={getPlayerName(players, phase.presidentId)}
              chancellorNomineeName={getPlayerName(
                players,
                phase.chancellorNomineeId ?? "",
              )}
              passed={gameState.electionPassed}
              votes={(gameState.electionVotes ?? []).map((v) => ({
                playerName: getPlayerName(players, v.playerId),
                vote: v.vote as "aye" | "no",
              }))}
            />
          );
        }
        return (
          <ElectionVoteView
            presidentName={getPlayerName(players, phase.presidentId)}
            chancellorNomineeName={getPlayerName(
              players,
              phase.chancellorNomineeId ?? "",
            )}
            myVote={gameState.myElectionVote as "aye" | "no" | undefined}
            onVote={onVote}
            isPending={isPending}
            isEliminated={isEliminated}
          />
        );
      }
      case SecretVillainPhase.PolicyPresident:
        return (
          <PolicyPresidentView
            drawnCards={gameState.policyCards?.drawnCards ?? []}
            selectedIndex={selectedCardIndex}
            onSelectCard={onSelectCard}
            onDiscard={onDiscardCard}
            isPending={isPending}
            isPresident={phase.presidentId === myPlayerId}
            presidentName={getPlayerName(players, phase.presidentId)}
          />
        );
      case SecretVillainPhase.PolicyChancellor: {
        const chancellorId = phase.chancellorId ?? "";
        const isChancellor = chancellorId === myPlayerId;
        const isPresident = phase.presidentId === myPlayerId;

        if (isPresident && gameState.vetoProposal?.vetoProposed) {
          return (
            <VetoPromptView
              onAccept={onAcceptVeto}
              onReject={onRejectVeto}
              isPending={isPending}
            />
          );
        }

        return (
          <PolicyChancellorView
            remainingCards={gameState.policyCards?.remainingCards ?? []}
            selectedIndex={selectedCardIndex}
            onSelectCard={onSelectCard}
            onPlay={onPlayCard}
            vetoUnlocked={gameState.vetoUnlocked}
            vetoProposed={gameState.policyCards?.vetoProposed}
            vetoResponse={gameState.policyCards?.vetoResponse}
            onProposeVeto={onProposeVeto}
            isPending={isPending}
            isChancellor={isChancellor}
            chancellorName={getPlayerName(players, chancellorId)}
          />
        );
      }
      case SecretVillainPhase.SpecialAction: {
        const alivePlayers = players.filter(
          (p) =>
            !(gameState.deadPlayerIds ?? []).includes(p.id) &&
            p.id !== phase.presidentId,
        );
        return (
          <SpecialActionView
            actionType={phase.actionType ?? ""}
            isPresident={phase.presidentId === myPlayerId}
            presidentName={getPlayerName(players, phase.presidentId)}
            players={alivePlayers}
            selectedPlayerId={selectedTargetId}
            onSelectPlayer={onSelectTarget}
            onConfirm={onConfirmAction}
            isPending={isPending}
            investigationResult={gameState.svInvestigationResult}
            investigationConsent={
              gameState.svPhase?.presidentId !== myPlayerId &&
              gameState.svInvestigationConsent === true
            }
            onConsent={onConsent}
            peekedCards={gameState.policyCards?.peekedCards}
          />
        );
      }
      default:
        return null;
    }
  }
}
