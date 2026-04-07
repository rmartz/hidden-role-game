"use client";

import { GameStatus } from "@/lib/types";
import { SecretVillainPhase } from "@/lib/game/modes/secret-villain/types";
import { FAILED_ELECTION_THRESHOLD } from "@/lib/game/modes/secret-villain/types";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import type { PlayerGameState } from "@/server/types";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import { BoardDisplay } from "./BoardDisplay";
import { ElectionNominationView } from "./ElectionNominationView";
import { ElectionVoteView } from "./ElectionVoteView";
import { ElectionResultView } from "./ElectionResultView";
import { PolicyPresidentView } from "./PolicyPresidentView";
import { PolicyChancellorView } from "./PolicyChancellorView";
import { VetoPromptView } from "./VetoPromptView";
import { SpecialActionView } from "./SpecialActionView";
import { SecretVillainGameOverView } from "./SecretVillainGameOverView";
import { SecretVillainStartingView } from "./SecretVillainStartingView";

function getPlayerName(
  players: PlayerGameState["players"],
  playerId: string,
): string {
  return players.find((p) => p.id === playerId)?.name ?? playerId;
}

export interface SecretVillainGameScreenViewProps {
  gameState: SecretVillainPlayerGameState;
  // Election actions
  selectedChancellorId?: string;
  onSelectChancellor: (playerId: string) => void;
  onConfirmNomination: () => void;
  onVote: (vote: "aye" | "no") => void;
  /** Tally votes and show results. */
  onResolveElection: () => void;
  // Policy actions
  onDrawCards: () => void;
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
  /** Acknowledge a special action result and advance to next election. */
  onResolveAction: () => void;
  onConsent: () => void;
  onPeek: () => void;
  /** Advance from election results to the next phase. */
  onAdvanceFromElection: () => void;
  // Game over
  onReturnToLobby: () => void;
  // Starting
  startingSecondsRemaining?: number;
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
  onResolveElection,
  onDrawCards,
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
  onResolveAction,
  onConsent,
  onPeek,
  onAdvanceFromElection,
  onReturnToLobby,
  startingSecondsRemaining,
  isPending,
  isReturning,
  returnError,
}: SecretVillainGameScreenViewProps) {
  if (gameState.status.type === GameStatus.Starting) {
    return (
      <SecretVillainStartingView
        gameState={gameState}
        secondsRemaining={startingSecondsRemaining}
      />
    );
  }

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

  const boardSection = board?.powerTable ? (
    <BoardDisplay
      goodCardsPlayed={board.goodCardsPlayed}
      badCardsPlayed={board.badCardsPlayed}
      failedElectionCount={board.failedElectionCount}
      failedElectionThreshold={FAILED_ELECTION_THRESHOLD}
      powerTable={board.powerTable}
      vetoUnlocked={gameState.vetoUnlocked}
      svTheme={gameState.svTheme}
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
                vote: v.vote,
              }))}
              onContinue={onAdvanceFromElection}
              isPending={isPending}
            />
          );
        }
        const boardPlayerId = gameState.gameOwner?.id;
        const nonVotingPlayerIds = boardPlayerId ? [boardPlayerId] : [];
        const deadSet = new Set(gameState.deadPlayerIds ?? []);
        const aliveCount = players.filter(
          (p) => !deadSet.has(p.id) && p.id !== boardPlayerId,
        ).length;
        const allVoted = (gameState.electionVoteCount ?? 0) >= aliveCount;

        return (
          <ElectionVoteView
            presidentName={getPlayerName(players, phase.presidentId)}
            chancellorNomineeName={getPlayerName(
              players,
              phase.chancellorNomineeId ?? "",
            )}
            myVote={gameState.myElectionVote}
            onVote={onVote}
            onResolve={onResolveElection}
            allVoted={allVoted}
            timerDurationSeconds={gameState.timerConfig.electionVoteSeconds}
            voteStartedAt={
              phase.startedAt ? new Date(phase.startedAt) : undefined
            }
            players={players}
            votedPlayerIds={gameState.votedPlayerIds}
            eliminatedPlayerIds={gameState.deadPlayerIds}
            nonVotingPlayerIds={nonVotingPlayerIds}
            isPending={isPending}
            isEliminated={isEliminated}
          />
        );
      }
      case SecretVillainPhase.PolicyPresident:
        return (
          <PolicyPresidentView
            drawnCards={gameState.policyCards?.drawnCards ?? []}
            cardsRevealed={gameState.policyCards?.drawnCards !== undefined}
            selectedIndex={selectedCardIndex}
            onSelectCard={onSelectCard}
            onDraw={onDrawCards}
            onDiscard={onDiscardCard}
            isPending={isPending}
            isPresident={phase.presidentId === myPlayerId}
            presidentName={getPlayerName(players, phase.presidentId)}
            svTheme={gameState.svTheme}
          />
        );
      case SecretVillainPhase.PolicyChancellor: {
        const chancellorId = phase.chancellorId ?? "";
        const isChancellor = chancellorId === myPlayerId;
        const isPresident = phase.presidentId === myPlayerId;

        if (
          isPresident &&
          gameState.vetoProposal?.vetoProposed &&
          gameState.vetoProposal.vetoResponse === undefined
        ) {
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
            svTheme={gameState.svTheme}
          />
        );
      }
      case SecretVillainPhase.SpecialAction: {
        if (!phase.actionType) return null;
        const alivePlayers = players.filter(
          (p) =>
            !(gameState.deadPlayerIds ?? []).includes(p.id) &&
            p.id !== phase.presidentId,
        );
        return (
          <SpecialActionView
            actionType={phase.actionType}
            isPresident={phase.presidentId === myPlayerId}
            presidentName={getPlayerName(players, phase.presidentId)}
            players={alivePlayers}
            selectedPlayerId={selectedTargetId}
            onSelectPlayer={onSelectTarget}
            onConfirm={onConfirmAction}
            onResolve={onResolveAction}
            isPending={isPending}
            investigationResult={gameState.svInvestigationResult}
            investigationWaitingForPlayerId={
              gameState.svInvestigationWaitingForPlayerId
            }
            investigationConsent={
              gameState.svPhase?.presidentId !== myPlayerId &&
              gameState.svInvestigationConsent === true
            }
            onConsent={onConsent}
            onPeek={onPeek}
            peekedCards={gameState.policyCards?.peekedCards}
            svTheme={gameState.svTheme}
          />
        );
      }
      default:
        return null;
    }
  }
}
