"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinLobby } from "@/hooks";

import { JOIN_PROMPT_COPY } from "./JoinPrompt.copy";

interface JoinPromptViewProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | undefined;
  playerCount: number | undefined;
}

export function JoinPromptView({
  playerName,
  onPlayerNameChange,
  onSubmit,
  isSubmitting,
  error,
  playerCount,
}: JoinPromptViewProps) {
  return (
    <div className="w-full sm:max-w-[440px] sm:mx-auto mb-5">
      <Card>
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {JOIN_PROMPT_COPY.eyebrow}
          </p>
          <CardTitle>{JOIN_PROMPT_COPY.cardTitle}</CardTitle>
          {playerCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {JOIN_PROMPT_COPY.invitedCount(playerCount)}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error !== undefined && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <form
            aria-label="join"
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="join-name">{JOIN_PROMPT_COPY.nameLabel}</Label>
              <Input
                id="join-name"
                type="text"
                value={playerName}
                onChange={(e) => {
                  onPlayerNameChange(e.target.value);
                }}
                placeholder={JOIN_PROMPT_COPY.namePlaceholder}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || playerName.trim() === ""}
            >
              {isSubmitting
                ? JOIN_PROMPT_COPY.joining
                : JOIN_PROMPT_COPY.joinButton}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            {JOIN_PROMPT_COPY.redirectNote}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface JoinPromptProps {
  lobbyId: string;
  playerCount?: number;
  onJoined?: () => void;
}

export function JoinPrompt({
  lobbyId,
  playerCount,
  onJoined,
}: JoinPromptProps) {
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState("");

  const joinMutation = useJoinLobby(() => {
    void queryClient.invalidateQueries({ queryKey: ["lobby", lobbyId] });
    onJoined?.();
  });

  const errorMessage = joinMutation.error
    ? `${JOIN_PROMPT_COPY.errorPrefix}${joinMutation.error.message}`
    : undefined;

  return (
    <JoinPromptView
      playerName={playerName}
      onPlayerNameChange={setPlayerName}
      onSubmit={() => {
        joinMutation.mutate({ lobbyId, playerName });
      }}
      isSubmitting={joinMutation.isPending}
      error={errorMessage}
      playerCount={playerCount}
    />
  );
}
