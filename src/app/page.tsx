"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCreateLobby, useJoinLobby, useStoredLobbyQuery } from "@/hooks";
import { getLobbyId, getPlayerId } from "@/lib/api";
import { ENABLED_GAME_MODES, GAME_MODES } from "@/lib/game/modes";
import { getPlayerName } from "@/lib/player";
import { GameMode } from "@/lib/types";

import { HomePageView } from "./HomePageView";

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
      ? undefined
      : storedLobbyQuery.data;

  return (
    <HomePageView
      playerName={playerName}
      lobbyIdInput={lobbyIdInput}
      selectedGameMode={selectedGameMode}
      gameModeOptions={GAME_MODE_OPTIONS}
      activeLobby={
        activeLobby ? { gameId: activeLobby.gameId ?? undefined } : undefined
      }
      storedLobbyId={storedLobbyId ?? undefined}
      error={error}
      loading={loading}
      isCreatePending={createMutation.isPending}
      isJoinPending={joinMutation.isPending}
      onPlayerNameChange={setPlayerName}
      onLobbyIdChange={setLobbyIdInput}
      onGameModeChange={setSelectedGameMode}
      onCreateLobby={() => {
        createMutation.mutate(playerName);
      }}
      onJoinLobby={() => {
        joinMutation.mutate({ lobbyId: lobbyIdInput, playerName });
      }}
      onRejoinGame={() => {
        const { gameId } = activeLobby ?? {};
        if (gameId && activeLobby)
          router.push(`/${activeLobby.config.gameMode}/game/${gameId}`);
      }}
      onRejoinLobby={() => {
        if (storedLobbyId && activeLobby)
          router.push(`/${activeLobby.config.gameMode}/lobby/${storedLobbyId}`);
      }}
    />
  );
}
