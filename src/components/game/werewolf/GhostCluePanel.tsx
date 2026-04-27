"use client";

import { useState } from "react";
import { WerewolfAction } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { GHOST_CLUE_MAX_LENGTH } from "@/lib/game/modes/werewolf/actions/submit-ghost-clue";
import { useGameAction } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface GhostCluePanelViewProps {
  ghostClues: { turn: number; clue: string }[];
  alreadySubmittedThisTurn: boolean;
  clue: string;
  onClueChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function GhostCluePanelView({
  ghostClues,
  alreadySubmittedThisTurn,
  clue,
  onClueChange,
  onSubmit,
  isPending,
}: GhostCluePanelViewProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm">
          {WEREWOLF_COPY.ghost.clueHeading}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ghostClues.length > 0 && (
          <ul className="mb-3 space-y-1 text-sm text-muted-foreground">
            {ghostClues.map((c) => (
              <li key={c.turn}>
                {WEREWOLF_COPY.ghost.clueTurn(c.turn, c.clue)}
              </li>
            ))}
          </ul>
        )}
        {alreadySubmittedThisTurn ? (
          <p className="text-sm text-muted-foreground italic">
            {WEREWOLF_COPY.ghost.clueAlreadySubmitted}
          </p>
        ) : (
          <div className="flex gap-2">
            <Input
              value={clue}
              onChange={(e) => {
                onClueChange(e.target.value);
              }}
              maxLength={GHOST_CLUE_MAX_LENGTH}
              placeholder={WEREWOLF_COPY.ghost.clueInputPlaceholder}
              aria-label={WEREWOLF_COPY.ghost.clueInputLabel}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={!clue.trim() || isPending}
            >
              {WEREWOLF_COPY.ghost.clueSubmitButton}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GhostCluePanelProps {
  gameId: string;
  ghostClues: { turn: number; clue: string }[];
  alreadySubmittedThisTurn: boolean;
}

export function GhostCluePanel({
  gameId,
  ghostClues,
  alreadySubmittedThisTurn,
}: GhostCluePanelProps) {
  const action = useGameAction(gameId);
  const [clue, setClue] = useState("");

  const handleSubmit = () => {
    if (!clue.trim() || alreadySubmittedThisTurn) return;
    action.mutate({
      actionId: WerewolfAction.SubmitGhostClue,
      payload: { clue: clue.trim() },
    });
    setClue("");
  };

  return (
    <GhostCluePanelView
      ghostClues={ghostClues}
      alreadySubmittedThisTurn={alreadySubmittedThisTurn}
      clue={clue}
      onClueChange={setClue}
      onSubmit={handleSubmit}
      isPending={action.isPending}
    />
  );
}
