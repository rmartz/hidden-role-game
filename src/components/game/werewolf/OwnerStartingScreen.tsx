"use client";

import { useMemo, useState } from "react";
import { GameStatus, GameMode } from "@/lib/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleLabel } from "@/components/RoleLabel";
import { GAME_MODES } from "@/lib/game/modes";
import { OwnerHeader } from "./OwnerHeader";
import { OWNER_STARTING_SCREEN_COPY } from "./OwnerStartingScreen.copy";

interface OwnerStartingScreenProps {
  gameId: string;
  gameState: WerewolfPlayerGameState;
  onStart: () => void;
}

export function OwnerStartingScreen({
  gameId,
  gameState,
  onStart,
}: OwnerStartingScreenProps) {
  const startedAtMs =
    gameState.status.type === GameStatus.Starting
      ? gameState.status.startedAt
      : undefined;
  const startedAt = useMemo(
    () => new Date(startedAtMs ?? Date.now()),
    [startedAtMs],
  );

  const sessionStorageKey = useMemo(
    () => `no-device-roles-viewed-${gameId}`,
    [gameId],
  );

  const [viewedPlayerIds, setViewedPlayerIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set<string>();
    const stored = sessionStorage.getItem(sessionStorageKey);
    if (!stored) return new Set<string>();
    try {
      return new Set<string>(JSON.parse(stored) as string[]);
    } catch {
      return new Set<string>();
    }
  });

  const hiddenRoles = (gameState.hiddenRoleIds ?? []).flatMap((roleId) => {
    const role = GAME_MODES[GameMode.Werewolf].roles[roleId];
    return role ? [role] : [];
  });

  const noDevicePlayers = gameState.players.filter((p) => p.noDevice);

  function handleStart() {
    sessionStorage.removeItem(sessionStorageKey);
    onStart();
  }

  function handleRevealNoDeviceRole(playerId: string) {
    setViewedPlayerIds((prev) => {
      const next = new Set(prev);
      next.add(playerId);
      sessionStorage.setItem(sessionStorageKey, JSON.stringify([...next]));
      return next;
    });
  }

  const timerConfig = gameState.timerConfig;
  const timer = {
    durationSeconds: timerConfig.startCountdownSeconds,
    autoAdvance: timerConfig.autoAdvance,
    startedAt,
    onTimerTrigger: handleStart,
  };

  const noDeviceRoleMap = new Map(
    (gameState.visibleRoleAssignments ?? []).map((a) => [a.player.id, a.role]),
  );

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <OwnerHeader
        title="Game Starting"
        advanceLabel="Start Now"
        onAdvance={handleStart}
        timer={timer}
      />
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        executionerTargetId={gameState.executionerTargetId}
      />
      {noDevicePlayers.length > 0 && (
        <Card className="mb-5 border-blue-500 dark:border-blue-600">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400">
              {OWNER_STARTING_SCREEN_COPY.noDeviceRolesTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {OWNER_STARTING_SCREEN_COPY.noDeviceRolesDescription}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {noDevicePlayers.map((player) => {
                const alreadyViewed = viewedPlayerIds.has(player.id);
                const role = noDeviceRoleMap.get(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    disabled={alreadyViewed}
                    onClick={() => {
                      handleRevealNoDeviceRole(player.id);
                    }}
                    className={`relative rounded-lg border p-3 text-left transition-colors ${
                      alreadyViewed
                        ? "cursor-not-allowed opacity-50 bg-muted"
                        : "cursor-pointer hover:bg-accent border-border"
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{player.name}</p>
                    {alreadyViewed && role ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        {alreadyViewed
                          ? OWNER_STARTING_SCREEN_COPY.noDeviceAlreadyViewed
                          : OWNER_STARTING_SCREEN_COPY.noDeviceRevealPrompt}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {hiddenRoles.length > 0 && (
        <Card className="mb-5 border-amber-500 dark:border-amber-600">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400">
              {OWNER_STARTING_SCREEN_COPY.hiddenRolesTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {OWNER_STARTING_SCREEN_COPY.hiddenRolesDescription}
            </p>
            <div className="flex flex-wrap gap-2">
              {hiddenRoles.map((role, i) => (
                <RoleLabel
                  key={`${role.id}-${String(i)}`}
                  role={role}
                  gameMode={GameMode.Werewolf}
                  showTeam
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <GameRolesList
        roles={gameState.rolesInPlay ?? []}
        gameMode={gameState.gameMode}
      />
    </div>
  );
}
