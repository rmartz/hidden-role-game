"use client";

import { useMemo } from "react";
import { GameStatus, GameMode } from "@/lib/types";
import type { WerewolfPlayerGameState } from "@/lib/game/modes/werewolf/player-state";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { GameRolesList, PlayersRoleList } from "@/components/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleLabel } from "@/components/RoleLabel";
import { GAME_MODES } from "@/lib/game/modes";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { OwnerHeader } from "./OwnerHeader";
import { OWNER_STARTING_SCREEN_COPY } from "./OwnerStartingScreen.copy";

interface OwnerStartingScreenProps {
  gameState: WerewolfPlayerGameState;
  onStart: () => void;
}

export function OwnerStartingScreen({
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

  const timerConfig = gameState.timerConfig;
  const timer = {
    durationSeconds: timerConfig.startCountdownSeconds,
    autoAdvance: timerConfig.autoAdvance,
    startedAt,
    onTimerTrigger: onStart,
  };

  const hiddenRoles = (gameState.hiddenRoleIds ?? []).flatMap((roleId) => {
    const role = GAME_MODES[GameMode.Werewolf].roles[roleId];
    return role ? [role] : [];
  });

  const masonRoleId: string = WerewolfRole.Mason;
  const masonInPlay = gameState.rolesInPlay?.some((r) => r.id === masonRoleId);

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <OwnerHeader
        title="Game Starting"
        advanceLabel="Start Now"
        onAdvance={onStart}
        timer={timer}
      />
      {masonInPlay && (
        <p className="mb-5 text-sm text-amber-700 dark:text-amber-400">
          {WEREWOLF_COPY.mason.narratorWarning}
        </p>
      )}
      <PlayersRoleList
        assignments={gameState.visibleRoleAssignments}
        gameMode={gameState.gameMode}
        executionerTargetId={gameState.executionerTargetId}
      />
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
