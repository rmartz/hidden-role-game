"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useJoinLobby } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOIN_PROMPT_COPY } from "./JoinPrompt.copy";

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
        <CardTitle>{JOIN_PROMPT_COPY.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{JOIN_PROMPT_COPY.description}</p>
        {joinMutation.error && (
          <p className="text-destructive text-sm">
            {JOIN_PROMPT_COPY.errorPrefix}
            {joinMutation.error.message}
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
            <Label htmlFor="join-name">{JOIN_PROMPT_COPY.nameLabel}</Label>
            <Input
              id="join-name"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
              }}
              placeholder={JOIN_PROMPT_COPY.namePlaceholder}
            />
          </div>
          <Button
            type="submit"
            disabled={joinMutation.isPending || playerName.trim() === ""}
          >
            {joinMutation.isPending
              ? JOIN_PROMPT_COPY.joining
              : JOIN_PROMPT_COPY.joinButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
