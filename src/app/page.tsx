"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameMode } from "@/lib/types";
import { ENABLED_GAME_MODES, GAME_MODES } from "@/lib/game/modes";
import { getLobbyId, getPlayerId } from "@/lib/api";
import { getPlayerName } from "@/lib/player";
import { useCreateLobby, useJoinLobby, useStoredLobbyQuery } from "@/hooks";
import { HOME_PAGE_COPY } from "./page.copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GAME_MODE_OPTIONS = ENABLED_GAME_MODES.map((mode) => ({
  value: mode,
  label: GAME_MODES[mode].name,
}));

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyIdInput, setLobbyIdInput] = useState("");
  const [selectedGameMode, setSelectedGameMode] = useState(GameMode.Werewolf);

  const createMutation = useCreateLobby(selectedGameMode);
  const joinMutation = useJoinLobby((data) => {
    router.push(`/${data.lobby.config.gameMode}/lobby/${data.lobby.id}`);
  });

  const storedLobbyId = getLobbyId();
  const myPlayerId = getPlayerId();

  const storedLobbyQuery = useStoredLobbyQuery(storedLobbyId);

  const storedPlayerName =
    getPlayerName(storedLobbyQuery.data?.players, myPlayerId) ?? "";

  useEffect(() => {
    if (storedPlayerName && !playerName) {
      setPlayerName(storedPlayerName);
    }
  }, [storedPlayerName, playerName]);

  const error = createMutation.error?.message ?? joinMutation.error?.message;
  const loading = createMutation.isPending || joinMutation.isPending;
  // Hide the active lobby panel once a create/join is in progress to avoid
  // it flashing into view after localStorage is written but before navigation.
  const activeLobby =
    loading || createMutation.isSuccess || joinMutation.isSuccess
      ? null
      : storedLobbyQuery.data;

  const activeLobbyPanel = activeLobby ? (
    <Card className="mb-5">
      <CardContent className="pt-6 space-y-3">
        {activeLobby.gameId ? (
          <>
            <p>{HOME_PAGE_COPY.activeGame}</p>
            <Button
              onClick={() => {
                const { gameId } = activeLobby;
                if (gameId)
                  router.push(`/${activeLobby.config.gameMode}/game/${gameId}`);
              }}
            >
              {HOME_PAGE_COPY.rejoinGame}
            </Button>
          </>
        ) : (
          <>
            <p>{HOME_PAGE_COPY.activeLobby(storedLobbyId ?? "")}</p>
            <Button
              onClick={() => {
                if (storedLobbyId)
                  router.push(
                    `/${activeLobby.config.gameMode}/lobby/${storedLobbyId}`,
                  );
              }}
            >
              {HOME_PAGE_COPY.rejoinLobby}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  ) : null;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-1">{HOME_PAGE_COPY.title}</h1>
        <p className="text-sm text-muted-foreground">
          {HOME_PAGE_COPY.subtitle}
        </p>
      </div>

      {activeLobbyPanel}

      {error && (
        <p className="text-destructive text-sm mb-3">
          {HOME_PAGE_COPY.errorPrefix}
          {error}
        </p>
      )}

      <div className="flex flex-col items-center mb-6">
        <div className="w-full max-w-xs space-y-1">
          <Label htmlFor="player-name">{HOME_PAGE_COPY.playerNameLabel}</Label>
          <Input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
            }}
            placeholder={HOME_PAGE_COPY.playerNamePlaceholder}
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="game-mode">{HOME_PAGE_COPY.gameModeLabel}</Label>
            <Select
              value={selectedGameMode}
              onValueChange={(v) => {
                const match = GAME_MODE_OPTIONS.find((opt) => opt.value === v);
                if (match) setSelectedGameMode(match.value);
              }}
            >
              <SelectTrigger id="game-mode">
                <SelectValue>{GAME_MODES[selectedGameMode].name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GAME_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              createMutation.mutate(playerName);
            }}
            disabled={loading || playerName.trim() === ""}
          >
            {createMutation.isPending
              ? HOME_PAGE_COPY.creating
              : HOME_PAGE_COPY.createLobby}
          </Button>
        </div>

        <div className="border-l" />

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="lobby-id">{HOME_PAGE_COPY.lobbyIdLabel}</Label>
            <Input
              id="lobby-id"
              type="text"
              value={lobbyIdInput}
              onChange={(e) => {
                setLobbyIdInput(e.target.value);
              }}
              placeholder={HOME_PAGE_COPY.lobbyIdPlaceholder}
            />
          </div>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              joinMutation.mutate({ lobbyId: lobbyIdInput, playerName });
            }}
            disabled={
              loading || playerName.trim() === "" || lobbyIdInput.trim() === ""
            }
          >
            {joinMutation.isPending
              ? HOME_PAGE_COPY.joining
              : HOME_PAGE_COPY.joinLobby}
          </Button>
        </div>
      </div>
    </div>
  );
}
