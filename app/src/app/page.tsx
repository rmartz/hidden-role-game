"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game-modes";
import { getLobbyId, getPlayerId } from "@/lib/api";
import { getPlayerName } from "@/lib/player-utils";
import { useCreateLobby, useJoinLobby, useStoredLobbyQuery } from "@/hooks";
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

const GAME_MODE_OPTIONS = Object.values(GameMode).map((mode) => ({
  value: mode,
  label: GAME_MODES[mode].name,
}));

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyIdInput, setLobbyIdInput] = useState("");
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(
    GameMode.Werewolf,
  );

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
            <p>You have an active game in progress.</p>
            <Button
              onClick={() => {
                const { gameId } = activeLobby;
                if (gameId)
                  router.push(`/${activeLobby.config.gameMode}/game/${gameId}`);
              }}
            >
              Rejoin Game
            </Button>
          </>
        ) : (
          <>
            <p>You are already in lobby: {storedLobbyId}</p>
            <Button
              onClick={() => {
                if (storedLobbyId)
                  router.push(
                    `/${activeLobby.config.gameMode}/lobby/${storedLobbyId}`,
                  );
              }}
            >
              Rejoin Lobby
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  ) : null;

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Hidden Role Game</h1>

      {activeLobbyPanel}

      {error && <p className="text-destructive text-sm mb-3">Error: {error}</p>}

      <div className="space-y-3 mb-4">
        <div className="space-y-1">
          <Label htmlFor="player-name">Your name</Label>
          <Input
            id="player-name"
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
            }}
            placeholder="Enter your name"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lobby-id">Lobby ID</Label>
          <Input
            id="lobby-id"
            type="text"
            value={lobbyIdInput}
            onChange={(e) => {
              setLobbyIdInput(e.target.value);
            }}
            placeholder="Leave blank to create a new lobby"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="game-mode">Game</Label>
          <Select
            value={selectedGameMode}
            onValueChange={(v) => {
              const match = GAME_MODE_OPTIONS.find((opt) => opt.value === v);
              if (match) setSelectedGameMode(match.value);
            }}
          >
            <SelectTrigger id="game-mode" className="max-w-xs">
              <SelectValue />
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
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            createMutation.mutate(playerName);
          }}
          disabled={loading || playerName.trim() === ""}
        >
          {createMutation.isPending ? "Creating..." : "Create Lobby"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            joinMutation.mutate({ lobbyId: lobbyIdInput, playerName });
          }}
          disabled={
            loading || playerName.trim() === "" || lobbyIdInput.trim() === ""
          }
        >
          {joinMutation.isPending ? "Joining..." : "Join Lobby"}
        </Button>
      </div>
    </div>
  );
}
