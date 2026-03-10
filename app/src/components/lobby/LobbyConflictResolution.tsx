"use client";

import { useRouter } from "next/navigation";
import type { PublicLobby } from "@/server/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface LobbyConflictResolutionProps {
  conflictLobby: PublicLobby;
  conflictLobbyId: string;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  isJoining: boolean;
  onJoin: () => void;
}

export function LobbyConflictResolution({
  conflictLobby,
  conflictLobbyId,
  playerName,
  onPlayerNameChange,
  isJoining,
  onJoin,
}: LobbyConflictResolutionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {conflictLobby.gameId ? (
          <p>You have an active game in lobby {conflictLobbyId}.</p>
        ) : (
          <p>You are already in lobby {conflictLobbyId}.</p>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => {
              const { gameId } = conflictLobby;
              if (gameId) {
                router.push(`/game/${gameId}`);
              } else {
                router.push(`/lobby/${conflictLobbyId}`);
              }
            }}
          >
            {conflictLobby.gameId ? "Rejoin Game" : "Stay In Previous Lobby"}
          </Button>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              value={playerName}
              onChange={(e) => {
                onPlayerNameChange(e.target.value);
              }}
              placeholder="Your name"
              disabled={isJoining}
              className="w-48"
            />
            <Button
              onClick={onJoin}
              disabled={isJoining || playerName.trim() === ""}
            >
              {isJoining ? "Joining..." : "Leave and Join This Lobby"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
