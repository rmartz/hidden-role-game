"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { PhaseKey } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import type { PublicLobbyPlayer } from "@/server/types";
import { getPlayerName } from "@/lib/player-utils";
import { ConfirmTargetButton } from "./ConfirmTargetButton";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface AltruistActionPanelProps {
  gameId: string;
  players: PublicLobbyPlayer[];
  attackedPlayerIds: string[];
  myNightTarget: string | null | undefined;
  isConfirmed: boolean;
  confirmPhaseKey: PhaseKey | undefined;
}

export function AltruistActionPanel({
  gameId,
  players,
  attackedPlayerIds,
  myNightTarget,
  isConfirmed,
  confirmPhaseKey,
}: AltruistActionPanelProps) {
  const action = useGameAction(gameId);

  const hasDecided = myNightTarget !== undefined;

  return (
    <div>
      {attackedPlayerIds.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4 italic">
          {WEREWOLF_COPY.altruist.noAttacks}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-2">
            {WEREWOLF_COPY.altruist.attackedIntro}
          </p>
          <p className="text-sm font-medium mb-2">
            {WEREWOLF_COPY.altruist.attackedHeading}
          </p>
          <div className="flex flex-col gap-2 max-w-sm mx-auto mb-2">
            {attackedPlayerIds.map((id) => {
              const isSelected = myNightTarget === id;
              const playerName = getPlayerName(players, id) ?? id;
              return (
                <Button
                  key={id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    action.mutate({
                      actionId: WerewolfAction.SetNightTarget,
                      payload: { targetPlayerId: isSelected ? undefined : id },
                    });
                  }}
                  disabled={action.isPending || isConfirmed}
                >
                  {isSelected
                    ? WEREWOLF_COPY.altruist.savingButton(playerName)
                    : WEREWOLF_COPY.altruist.saveButton(playerName)}
                </Button>
              );
            })}
          </div>
        </>
      )}

      {!isConfirmed && (
        <div className="flex flex-col gap-2 max-w-sm mx-auto">
          <Button
            variant={myNightTarget === null ? "default" : "outline"}
            onClick={() => {
              action.mutate({
                actionId: WerewolfAction.SetNightTarget,
                payload: {
                  targetPlayerId: myNightTarget === null ? undefined : null,
                },
              });
            }}
            disabled={action.isPending}
          >
            {myNightTarget === null
              ? WEREWOLF_COPY.targetSelection.noTarget_selected
              : WEREWOLF_COPY.targetSelection.noTarget}
          </Button>
        </div>
      )}

      <ConfirmTargetButton
        gameId={gameId}
        roleId={confirmPhaseKey}
        hasTarget={!!myNightTarget}
        hasDecided={hasDecided}
        isConfirmed={isConfirmed}
      />
    </div>
  );
}
