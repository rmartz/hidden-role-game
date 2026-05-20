"use client";

import { ShareLobby } from "@/components/lobby";

import { LOBBY_PAGE_COPY } from "./page.copy";

export interface LobbyPageHeaderProps {
  lobbyName: string | undefined;
  lobbyId: string;
  gameMode: string;
}

export function LobbyPageHeader({
  lobbyName,
  lobbyId,
  gameMode,
}: LobbyPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">
        {lobbyName ?? LOBBY_PAGE_COPY.loadingTitle}
      </h1>
      <ShareLobby lobbyId={lobbyId} gameMode={gameMode} />
    </div>
  );
}
