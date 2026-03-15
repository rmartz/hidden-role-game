"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLobbyId, getPlayerId } from "@/lib/api";
import { getPlayerName } from "@/lib/player-utils";
import { useCreateLobby, useJoinLobby, useStoredLobbyQuery } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [lobbyIdInput, setLobbyIdInput] = useState("");

  const createMutation = useCreateLobby();
  const joinMutation = useJoinLobby((data) => {
    router.push(`/lobby/${data.lobby.id}`);
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

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Hidden Role Game</h1>

      {activeLobby && (
        <Card className="mb-5">
          <CardContent className="pt-6 space-y-3">
            {activeLobby.gameId ? (
              <>
                <p>You have an active game in progress.</p>
                <Button
                  onClick={() => {
                    const { gameId } = activeLobby;
                    if (gameId) router.push(`/game/${gameId}`);
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
                    if (storedLobbyId) router.push(`/lobby/${storedLobbyId}`);
                  }}
                >
                  Rejoin Lobby
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
