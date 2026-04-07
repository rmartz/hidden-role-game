"use client";

import { useState } from "react";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/types";
import type { GameConfig } from "@/server/types";
import { DEFAULT_WEREWOLF_TIMER_CONFIG } from "@/lib/game/modes/werewolf/timer-config";
import { DEFAULT_WEREWOLF_MODE_CONFIG } from "@/lib/game/modes/werewolf/lobby-config";
import { GameConfigurationPanel } from "@/components/lobby";
import { useAppSelector } from "@/store";
import { selectRoleSlots } from "@/store/game-config-slice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { DebugPlayer } from "@/app/api/debug/game/route";
import { DebugGameView } from "./DebugGameView";
import type { GameInfo } from "./DebugGameView";

const DEFAULT_CONFIG: GameConfig = {
  gameMode: GameMode.Werewolf,
  roleConfigMode: RoleConfigMode.Default,
  roleSlots: [],
  showConfigToPlayers: false,
  showRolesInPlay: ShowRolesInPlay.None,
  timerConfig: DEFAULT_WEREWOLF_TIMER_CONFIG,
  modeConfig: DEFAULT_WEREWOLF_MODE_CONFIG,
};

export default function DebugPage() {
  const [playerCount, setPlayerCount] = useState(7);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const gameMode = useAppSelector((s) => s.gameConfig.gameMode);
  const roleSlots = useAppSelector((s) => selectRoleSlots(s.gameConfig));
  const showRolesInPlay = useAppSelector((s) => s.gameConfig.showRolesInPlay);
  const timerConfig = useAppSelector((s) => s.gameConfig.timerConfig);
  const modeConfig = useAppSelector((s) => s.gameConfig.modeConfig);

  async function handleCreateGame() {
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
          showRolesInPlay,
          timerConfig,
          modeConfig,
        }),
      });
      const body = (await res.json()) as {
        status: string;
        data?: { gameId: string; gameMode: GameMode; players: DebugPlayer[] };
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
    <div className="p-5 max-w-4xl mx-auto">
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
        showUnreleased={true}
        onStartGame={() => {
          void handleCreateGame();
        }}
      />
    </div>
  );
}
