"use client";

import { useState } from "react";
import { GameMode } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { GameConfigurationPanel } from "@/components/lobby";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DebugPlayer } from "@/app/api/debug/game/route";
import { DebugGameView } from "./DebugGameView";
import type { GameInfo } from "./DebugGameView";

const DEFAULT_CONFIG = {
  gameMode: GameMode.Werewolf,
  showConfigToPlayers: false,
  showRolesInPlay: true,
};

export default function DebugPage() {
  const [playerCount, setPlayerCount] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);

  async function handleCreateGame(roleSlots: RoleSlot[], gameMode: GameMode) {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/debug/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerCount,
          gameMode,
          roleSlots,
          showRolesInPlay: true,
        }),
      });
      const body = (await res.json()) as {
        status: string;
        data?: { gameId: string; players: DebugPlayer[] };
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "Failed to create game");
        return;
      }
      if (!body.data) {
        setError("Unexpected response from server");
        return;
      }
      const firstPlayer = body.data.players[0];
      if (firstPlayer) {
        localStorage.setItem("x-session-id", firstPlayer.sessionId);
        localStorage.setItem("player-id", firstPlayer.id);
      }
      setGameInfo(body.data);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsCreating(false);
    }
  }

  if (gameInfo) {
    return (
      <DebugGameView
        gameInfo={gameInfo}
        onReset={() => {
          setGameInfo(null);
        }}
      />
    );
  }

  return (
    <div className="p-5 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Game Debug</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Create a test game with fake players to inspect each player&apos;s
        perspective.
      </p>

      <div className="mb-4 space-y-1">
        <Label>Player count</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setPlayerCount((n) => Math.max(2, n - 1));
            }}
            disabled={playerCount <= 2}
          >
            −
          </Button>
          <span className="w-8 text-center text-sm font-medium">
            {playerCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setPlayerCount((n) => Math.min(20, n + 1));
            }}
            disabled={playerCount >= 20}
          >
            +
          </Button>
        </div>
      </div>

      {error && <p className="text-destructive text-sm mb-3">{error}</p>}

      <GameConfigurationPanel
        config={DEFAULT_CONFIG}
        playerCount={playerCount}
        readOnly={false}
        isPending={isCreating}
        onStartGame={(roleSlots, gameMode) => {
          void handleCreateGame(roleSlots, gameMode);
        }}
      />
    </div>
  );
}
