"use client";

import { useRouter } from "next/navigation";
import type { PublicLobby } from "@/server/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Lobby Conflict</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <form
            className="flex gap-2 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              onJoin();
            }}
          >
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
              type="submit"
              disabled={isJoining || playerName.trim() === ""}
            >
              {isJoining ? "Joining..." : "Leave and Join This Lobby"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
