"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJoinLobby } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface JoinPromptProps {
  lobbyId: string;
  onJoined?: () => void;
}

export function JoinPrompt({ lobbyId, onJoined }: JoinPromptProps) {
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
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Join Lobby</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Enter your name to join this lobby.
        </p>
        {joinMutation.error && (
          <p className="text-destructive text-sm">
            Error: {joinMutation.error.message}
          </p>
        )}
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleJoin();
          }}
        >
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
            type="submit"
            disabled={joinMutation.isPending || playerName.trim() === ""}
          >
            {joinMutation.isPending ? "Joining..." : "Join Lobby"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
