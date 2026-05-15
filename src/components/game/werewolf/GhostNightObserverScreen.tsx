"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GAME_MODES } from "@/lib/game/modes";
import type { WerewolfNighttimePhase } from "@/lib/game/modes/werewolf";
import { getPhaseLabel } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { isTeamNightAction } from "@/lib/game/modes/werewolf/types";
import { getPlayerName } from "@/lib/player";

import { NightPhaseOrderList } from "./NightPhaseOrderList";

interface GhostNightObserverScreenProps {
  gameState: WerewolfPlayerGameState;
  phase: WerewolfNighttimePhase;
}

export function GhostNightObserverScreen({
  gameState,
  phase,
}: GhostNightObserverScreenProps) {
  const modeConfig = GAME_MODES[gameState.gameMode];
  const { nightPhaseOrder, currentPhaseIndex } = phase;
  const nightActions = gameState.nightActions ?? phase.nightActions;
  const activePhaseKey = nightPhaseOrder[currentPhaseIndex] ?? "";
  const activePhaseLabel = getPhaseLabel(activePhaseKey, modeConfig.roles);
  const playerById = new Map(gameState.players.map((p) => [p.id, p]));

  const completedPhases = nightPhaseOrder
    .slice(0, currentPhaseIndex)
    .filter((phaseKey) => nightActions[phaseKey]?.confirmed === true);

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold mb-1">
        {WEREWOLF_COPY.ghost.nightObserverHeading}
      </h2>
      <p className="mb-4 text-sm text-muted-foreground italic">
        {WEREWOLF_COPY.ghost.nightObserverSubtext}
      </p>

      <Card className="mb-4">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {WEREWOLF_COPY.narrator.currentlyAwake}{" "}
            <strong>{activePhaseLabel}</strong>
          </CardTitle>
        </CardHeader>
        {completedPhases.length > 0 && (
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {completedPhases.map((phaseKey) => {
                const action = nightActions[phaseKey];
                const label = getPhaseLabel(phaseKey, modeConfig.roles);
                let targetText: string = WEREWOLF_COPY.ghost.targetNone;
                if (action) {
                  if (isTeamNightAction(action)) {
                    const target = action.suggestedTargetId;
                    targetText = target
                      ? (getPlayerName(gameState.players, target) ?? target)
                      : WEREWOLF_COPY.ghost.targetNone;
                  } else {
                    if (action.skipped) {
                      targetText = WEREWOLF_COPY.ghost.targetSkipped;
                    } else if (action.targetPlayerId) {
                      const name = playerById.get(action.targetPlayerId)?.name;
                      targetText = name ?? action.targetPlayerId;
                    }
                  }
                }
                return (
                  <li key={phaseKey}>
                    <span className="font-medium">{label}:</span> {targetText}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        )}
      </Card>

      <NightPhaseOrderList
        nightPhaseOrder={nightPhaseOrder}
        currentPhaseIndex={currentPhaseIndex}
        roles={modeConfig.roles}
      />
    </div>
  );
}
