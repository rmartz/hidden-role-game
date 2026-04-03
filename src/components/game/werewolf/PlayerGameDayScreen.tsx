"use client";

import { useMemo } from "react";
import { GAME_MODES } from "@/lib/game-modes";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import {
  WEREWOLF_ROLE_CATEGORY_LABELS,
  WEREWOLF_ROLE_CATEGORY_ORDER,
} from "@/lib/game-modes/werewolf/roles";
import type { WerewolfPlayerGameState } from "@/lib/game-modes/werewolf/player-state";
import { getPlayerName } from "@/lib/player-utils";
import { GameTimer, RoleGlossaryDialog } from "@/components/game";
import { NominationPanel } from "./NominationPanel";
import { PlayerNightSummary } from "./PlayerNightSummary";
import { PlayerRoleDisplay } from "./PlayerRoleDisplay";
import { PlayerStatusLists } from "./PlayerStatusLists";
import { TrialVotePanel } from "./TrialVotePanel";

interface PlayerGameDayScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
  turnState: WerewolfTurnState;
}

export function PlayerGameDayScreen({
  gameId,
  gameState,
  turnState,
}: PlayerGameDayScreenProps) {
  const timerConfig = gameState.timerConfig;
  const { phase } = turnState;
  const isDaytime = phase.type === WerewolfPhase.Daytime;
  const phaseStartedAt = useMemo(
    () => new Date(isDaytime ? phase.startedAt : Date.now()),
    [isDaytime, phase.startedAt],
  );
  const executionerTargetName = getPlayerName(
    gameState.players,
    gameState.executionerTargetId,
  );

  const modeConfig = GAME_MODES[gameState.gameMode];
  const glossaryRoles = gameState.rolesInPlay?.length
    ? gameState.rolesInPlay
        .map((r) => modeConfig.roles[r.id])
        .filter((r) => r !== undefined)
    : Object.values(modeConfig.roles);

  const hasActiveTrial =
    !!gameState.activeTrial && !gameState.activeTrial.verdict;
  const trialConcluded = !!gameState.activeTrial?.verdict;
  const nominationsBlocked =
    hasActiveTrial || (gameState.singleTrialPerDay && trialConcluded);

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="flex items-start justify-between mb-2">
        <h1 className="text-2xl font-bold">{WEREWOLF_COPY.day.title}</h1>
        {gameState.myRole && (
          <PlayerRoleDisplay
            role={gameState.myRole}
            gameMode={gameState.gameMode}
          />
        )}
      </div>
      <GameTimer
        durationSeconds={timerConfig.dayPhaseSeconds}
        autoAdvance={timerConfig.autoAdvance}
        startedAt={phaseStartedAt}
      />
      <p className="mb-4 text-muted-foreground">
        {WEREWOLF_COPY.day.gameUnderway}
      </p>
      <div className="mb-4">
        <RoleGlossaryDialog
          roles={glossaryRoles}
          gameMode={gameState.gameMode}
          title={WEREWOLF_COPY.glossary.dialogTitle}
          triggerLabel={WEREWOLF_COPY.glossary.openButton}
          categoryOrder={WEREWOLF_ROLE_CATEGORY_ORDER}
          categoryLabels={WEREWOLF_ROLE_CATEGORY_LABELS}
        />
      </div>

      <PlayerNightSummary
        players={gameState.players}
        nightStatus={gameState.nightStatus}
        myPlayerId={gameState.myPlayerId}
      />

      {gameState.exposerReveal && (
        <p className="mb-4 text-sm text-muted-foreground italic">
          {WEREWOLF_COPY.exposer.publicReveal(
            gameState.exposerReveal.playerName,
            gameState.exposerReveal.roleName,
          )}
        </p>
      )}

      {executionerTargetName && (
        <p className="mb-4 text-sm text-muted-foreground italic">
          {WEREWOLF_COPY.executioner.yourTarget(executionerTargetName)}
        </p>
      )}

      {gameState.amDead && (
        <p className="mb-4 font-semibold text-muted-foreground italic">
          {WEREWOLF_COPY.day.youAreEliminated}
        </p>
      )}

      {gameState.activeTrial && (
        <TrialVotePanel
          gameId={gameId}
          activeTrial={gameState.activeTrial}
          players={gameState.players}
          myPlayerId={gameState.myPlayerId}
          amDead={gameState.amDead}
          votePhaseSeconds={timerConfig.votePhaseSeconds}
          defensePhaseSeconds={timerConfig.defensePhaseSeconds}
          autoAdvance={timerConfig.autoAdvance}
          isSilenced={gameState.isSilenced}
          isHypnotized={gameState.isHypnotized}
        />
      )}

      {gameState.nominationsEnabled && !nominationsBlocked && (
        <NominationPanel
          gameId={gameId}
          players={gameState.players}
          myPlayerId={gameState.myPlayerId}
          amDead={gameState.amDead}
          isSilenced={gameState.isSilenced}
          nominations={gameState.nominations ?? []}
          myNominatedDefendantId={gameState.myNominatedDefendantId}
          deadPlayerIds={gameState.deadPlayerIds}
          gameOwnerId={gameState.gameOwner?.id}
        />
      )}

      <PlayerStatusLists
        players={gameState.players}
        deadPlayerIds={turnState.deadPlayerIds}
        gameOwnerId={gameState.gameOwner?.id}
        roleAssignments={gameState.visibleRoleAssignments}
      />
    </div>
  );
}
