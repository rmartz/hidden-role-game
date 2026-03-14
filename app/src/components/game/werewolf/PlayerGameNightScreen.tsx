"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import type { WerewolfTurnState } from "@/lib/game-modes/werewolf";
import { WerewolfPhase } from "@/lib/game-modes/werewolf";
import type { PlayerGameState } from "@/server/types";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";

interface Props {
  gameId: string;
  gameState: PlayerGameState;
  turnState: WerewolfTurnState;
}

export function PlayerGameNightScreen({ gameId, gameState, turnState }: Props) {
  const action = useGameAction(gameId);

  if (gameState.amDead) {
    return (
      <div className="p-5">
        <h1 className="text-2xl font-bold mb-2 text-muted-foreground">
          You Have Been Eliminated
        </h1>
        <p className="text-muted-foreground">
          You are no longer in the game. Stay quiet while the night continues.
        </p>
      </div>
    );
  }

  const { phase } = turnState;
  if (phase.type !== WerewolfPhase.Nighttime) return null;

  const isMyTurn =
    gameState.myRole?.id === phase.nightPhaseOrder[phase.currentPhaseIndex];

  if (!isMyTurn) return <div />;

  const canTarget = turnState.turn > 1;
  const hasVisibleTeammates = gameState.visibleRoleAssignments.length > 0;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-2">It&apos;s Your Turn</h1>
      <p className="text-muted-foreground mb-4">
        <strong className="text-foreground">{gameState.myRole?.name}</strong> —{" "}
        {canTarget
          ? "wake up and take your action."
          : hasVisibleTeammates
            ? "awake, find your teammate and make yourself known to the Narrator."
            : "awake and make yourself known to the Narrator."}
      </p>
      {canTarget && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Choose a target</h2>
          <div className="flex flex-col gap-2">
            {gameState.players
              .filter((p) => {
                // Exclude owner (narrator) and dead players.
                if (p.id === gameState.gameOwner?.id) return false;
                if (gameState.deadPlayerIds?.includes(p.id)) return false;
                return true;
              })
              .map((player) => {
                const isSelected = gameState.myNightTarget === player.id;
                return (
                  <Button
                    key={player.id}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => {
                      action.mutate({
                        actionId: WerewolfAction.SubmitNightTarget,
                        payload: { targetPlayerId: player.id },
                      });
                    }}
                    disabled={action.isPending}
                    className="justify-start"
                  >
                    {player.name}
                    {isSelected && " (selected)"}
                  </Button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
