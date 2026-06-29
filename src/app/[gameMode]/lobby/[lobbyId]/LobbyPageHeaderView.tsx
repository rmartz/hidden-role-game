"use client";

import { ShareLobby } from "@/components/lobby";

export interface LobbyPageHeaderViewProps {
  title: string;
  lobbyId: string;
  gameMode: string;
}

export function LobbyPageHeaderView({
  title,
  lobbyId,
  gameMode,
}: LobbyPageHeaderViewProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">{title}</h1>
      <ShareLobby lobbyId={lobbyId} gameMode={gameMode} />
    </div>
  );
}
