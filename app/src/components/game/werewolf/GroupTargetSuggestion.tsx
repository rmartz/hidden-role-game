"use client";

import { WerewolfAction } from "@/lib/game-modes/werewolf";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { getPlayerName } from "@/lib/player-utils";
import type { PublicLobbyPlayer } from "@/server/types";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface GroupTargetSuggestionProps {
  gameId: string;
  players: PublicLobbyPlayer[];
  suggestedTargetId: string;
  myNightTarget?: string | null;
  isConfirmed: boolean;
}

export function GroupTargetSuggestion({
  gameId,
  players,
  suggestedTargetId,
  myNightTarget,
  isConfirmed,
}: GroupTargetSuggestionProps) {
  const action = useGameAction(gameId);
  const suggestedName =
    getPlayerName(players, suggestedTargetId) ?? suggestedTargetId;
  const isApproved = myNightTarget === suggestedTargetId;

  return (
    <div className="mt-2 pt-2 border-t">
      <p className="text-xs mb-1.5">
        {WEREWOLF_COPY.targetSelection.suggestedTarget(suggestedName)}
      </p>
      {!isApproved && !isConfirmed && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            action.mutate({
              actionId: WerewolfAction.SetNightTarget,
              payload: { targetPlayerId: suggestedTargetId },
            });
          }}
          disabled={action.isPending}
        >
          {WEREWOLF_COPY.targetSelection.approveTarget}
        </Button>
      )}
    </div>
  );
}
