"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import type { DebugPlayer } from "@/app/api/debug/game/route";
import { Button } from "@/components/ui/button";
import type { GameMode } from "@/lib/types";

import { DebugAllStatesButton } from "./DebugAllStatesButton";
import { GameScreenForPlayer } from "./GameScreenForPlayer";

export interface GameInfo {
  gameId: string;
  gameMode: GameMode;
  players: DebugPlayer[];
}

export interface DebugGameViewProps {
  gameInfo: GameInfo;
  onReset: () => void;
}

export function DebugGameView({ gameInfo, onReset }: DebugGameViewProps) {
  const queryClient = useQueryClient();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { gameId, gameMode, players } = gameInfo;

  function handleSelectPlayer(index: number) {
    const player = players[index];
    if (!player) return;
    localStorage.setItem("x-session-id", player.sessionId);
    localStorage.setItem("player-id", player.id);
    queryClient.removeQueries({ queryKey: ["game", gameId] });
    setSelectedIndex(index);
  }

  const selectedPlayer = players[selectedIndex];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background sticky top-0 z-10 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onReset}>
          ← New game
        </Button>
        <div className="h-4 w-px bg-border" />
        <div className="flex gap-1.5 flex-wrap">
          <DebugAllStatesButton
            gameId={gameId}
            gameMode={gameMode}
            players={players}
          />
          {players.map((player, i) => (
            <Button
              key={player.id}
              variant={i === selectedIndex ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleSelectPlayer(i);
              }}
            >
              {player.name}
              {player.isOwner ? " (Owner)" : ""}
            </Button>
          ))}
        </div>
      </div>

      {selectedPlayer && (
        <div className="flex-1">
          <GameScreenForPlayer
            key={`${gameId}-${selectedPlayer.id}`}
            gameId={gameId}
            gameMode={gameMode}
          />
        </div>
      )}
    </div>
  );
}
