"use client";

import { useRouter } from "next/navigation";
import type { PublicLobby } from "@/server/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LOBBY_CONFLICT_RESOLUTION_COPY } from "./LobbyConflictResolution.copy";

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
        <CardTitle>{LOBBY_CONFLICT_RESOLUTION_COPY.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conflictLobby.gameId ? (
          <p>{LOBBY_CONFLICT_RESOLUTION_COPY.activeGame(conflictLobbyId)}</p>
        ) : (
          <p>
            {LOBBY_CONFLICT_RESOLUTION_COPY.alreadyInLobby(conflictLobbyId)}
          </p>
        )}
        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => {
              const { gameId } = conflictLobby;
              const { gameMode } = conflictLobby.config;
              if (gameId) {
                router.push(`/${gameMode}/game/${gameId}`);
              } else {
                router.push(`/${gameMode}/lobby/${conflictLobbyId}`);
              }
            }}
          >
            {conflictLobby.gameId
              ? LOBBY_CONFLICT_RESOLUTION_COPY.rejoinGame
              : LOBBY_CONFLICT_RESOLUTION_COPY.stayInPreviousLobby}
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
              placeholder={LOBBY_CONFLICT_RESOLUTION_COPY.namePlaceholder}
              disabled={isJoining}
              className="w-48"
            />
            <Button
              type="submit"
              disabled={isJoining || playerName.trim() === ""}
            >
              {isJoining
                ? LOBBY_CONFLICT_RESOLUTION_COPY.joining
                : LOBBY_CONFLICT_RESOLUTION_COPY.leaveAndJoin}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
