"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game/modes";
import { HOME_PAGE_COPY } from "./page.copy";

interface ActiveLobbyData {
  gameId: string | undefined;
  config: { gameMode: GameMode };
}

interface GameModeOption {
  value: GameMode;
  label: string;
}

export interface HomePageViewProps {
  playerName: string;
  lobbyIdInput: string;
  selectedGameMode: GameMode;
  gameModeOptions: GameModeOption[];
  activeLobby: ActiveLobbyData | undefined;
  storedLobbyId: string | undefined;
  error: string | undefined;
  loading: boolean;
  isCreatePending: boolean;
  isJoinPending: boolean;
  onPlayerNameChange: (name: string) => void;
  onLobbyIdChange: (id: string) => void;
  onGameModeChange: (mode: GameMode) => void;
  onCreateLobby: () => void;
  onJoinLobby: () => void;
  onRejoinGame: () => void;
  onRejoinLobby: () => void;
}

export function HomePageView({
  playerName,
  lobbyIdInput,
  selectedGameMode,
  gameModeOptions,
  activeLobby,
  storedLobbyId,
  error,
  loading,
  isCreatePending,
  isJoinPending,
  onPlayerNameChange,
  onLobbyIdChange,
  onGameModeChange,
  onCreateLobby,
  onJoinLobby,
  onRejoinGame,
  onRejoinLobby,
}: HomePageViewProps) {
  const activeLobbyPanel = activeLobby ? (
    <Card className="mb-5">
      <CardContent className="space-y-3 pt-6">
        {activeLobby.gameId ? (
          <>
            <p>{HOME_PAGE_COPY.activeGame}</p>
            <Button className="w-full" onClick={onRejoinGame}>
              {HOME_PAGE_COPY.rejoinGame}
            </Button>
          </>
        ) : (
          <>
            <p>{HOME_PAGE_COPY.activeLobby(storedLobbyId ?? "")}</p>
            <Button className="w-full" onClick={onRejoinLobby}>
              {HOME_PAGE_COPY.rejoinLobby}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  ) : null;

  const orStartFreshDivider = activeLobby ? (
    <div className="relative my-5 flex items-center">
      <div className="flex-1 border-t" />
      <span className="mx-4 text-sm text-muted-foreground">
        {HOME_PAGE_COPY.orStartFresh}
      </span>
      <div className="flex-1 border-t" />
    </div>
  ) : null;

  return (
    <div className="mx-auto max-w-lg p-5">
      <div className="mb-6 text-center">
        <h1 className="mb-1 text-2xl font-bold">{HOME_PAGE_COPY.title}</h1>
        <p className="text-sm text-muted-foreground">
          {HOME_PAGE_COPY.subtitle}
        </p>
      </div>

      {activeLobbyPanel}

      {orStartFreshDivider}

      {error && (
        <p className="mb-3 text-sm text-destructive">
          {HOME_PAGE_COPY.errorPrefix}
          {error}
        </p>
      )}

      <div className="mb-6 space-y-1">
        <Label htmlFor="player-name">{HOME_PAGE_COPY.playerNameLabel}</Label>
        <Input
          id="player-name"
          type="text"
          value={playerName}
          onChange={(e) => {
            onPlayerNameChange(e.target.value);
          }}
          placeholder={HOME_PAGE_COPY.playerNamePlaceholder}
        />
      </div>

      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label htmlFor="game-mode">{HOME_PAGE_COPY.gameModeLabel}</Label>
              <Select
                value={selectedGameMode}
                onValueChange={(v) => {
                  const match = gameModeOptions.find((opt) => opt.value === v);
                  if (match) onGameModeChange(match.value);
                }}
              >
                <SelectTrigger id="game-mode">
                  <SelectValue>{GAME_MODES[selectedGameMode].name}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {gameModeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={onCreateLobby}
              disabled={loading || playerName.trim() === ""}
            >
              {isCreatePending
                ? HOME_PAGE_COPY.creating
                : HOME_PAGE_COPY.createLobby}
            </Button>
          </CardContent>
        </Card>

        <div className="hidden border-l md:block" />

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-1">
              <Label htmlFor="lobby-id">{HOME_PAGE_COPY.lobbyIdLabel}</Label>
              <Input
                id="lobby-id"
                type="text"
                value={lobbyIdInput}
                onChange={(e) => {
                  onLobbyIdChange(e.target.value);
                }}
                placeholder={HOME_PAGE_COPY.lobbyIdPlaceholder}
              />
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={onJoinLobby}
              disabled={
                loading ||
                playerName.trim() === "" ||
                lobbyIdInput.trim() === ""
              }
            >
              {isJoinPending
                ? HOME_PAGE_COPY.joining
                : HOME_PAGE_COPY.joinLobby}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
