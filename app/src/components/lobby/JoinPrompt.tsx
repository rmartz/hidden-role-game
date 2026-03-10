"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJoinLobby } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  lobbyId: string;
  onJoined?: () => void;
}

export function JoinPrompt({ lobbyId, onJoined }: Props) {
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState("");

  const joinMutation = useJoinLobby(() => {
    void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    onJoined?.();
  });

  function handleJoin() {
    joinMutation.mutate({ lobbyId, playerName });
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Enter your name to join this lobby.
      </p>
      {joinMutation.error && (
        <p className="text-destructive text-sm">
          Error: {joinMutation.error.message}
        </p>
      )}
      <div className="space-y-1">
        <Label htmlFor="join-name">Your name</Label>
        <Input
          id="join-name"
          type="text"
          value={playerName}
          onChange={(e) => {
            setPlayerName(e.target.value);
          }}
          placeholder="Enter your name"
        />
      </div>
      <Button
        onClick={handleJoin}
        disabled={joinMutation.isPending || playerName.trim() === ""}
      >
        {joinMutation.isPending ? "Joining..." : "Join Lobby"}
      </Button>
    </div>
  );
}
