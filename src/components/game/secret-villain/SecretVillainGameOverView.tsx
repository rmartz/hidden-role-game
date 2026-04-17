"use client";

import { Team } from "@/lib/types";
import type { FinishedGameStatus } from "@/lib/types";
import { SecretVillainWinner } from "@/lib/game/modes/secret-villain/utils/win-condition";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game/modes/secret-villain/themes";
import type { SvThemeLabels } from "@/lib/game/modes/secret-villain/themes";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain/roles";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import type { VisibleTeammate } from "@/server/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SecretVillainGameOverViewProps {
  gameState: SecretVillainPlayerGameState;
  onReturnToLobby: () => void;
  isReturning?: boolean;
  returnError?: boolean;
}

interface RoleAssignmentListProps {
  assignments: VisibleTeammate[];
  themeLabels: SvThemeLabels;
}

function themedRoleName(roleId: string, themeLabels: SvThemeLabels): string {
  const roleMap: Partial<Record<SecretVillainRole, string>> = {
    [SecretVillainRole.Good]: themeLabels.goodRole,
    [SecretVillainRole.Bad]: themeLabels.badRole,
    [SecretVillainRole.SpecialBad]: themeLabels.specialBadRole,
  };
  return roleMap[roleId as SecretVillainRole] ?? roleId;
}

function RoleAssignmentList({
  assignments,
  themeLabels,
}: RoleAssignmentListProps) {
  if (assignments.length === 0) return null;
  return (
    <ul className="text-sm space-y-1">
      {assignments.map(({ player, role }) => (
        <li key={player.id} className="flex justify-between gap-4">
          <span>{player.name}</span>
          {role && (
            <span className="text-muted-foreground">
              {themedRoleName(role.id, themeLabels)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SecretVillainGameOverView({
  gameState,
  onReturnToLobby,
  isReturning,
  returnError,
}: SecretVillainGameOverViewProps) {
  const finishedStatus = gameState.status as FinishedGameStatus;
  const { winner } = finishedStatus;
  const themeLabels = getSvThemeLabels(gameState.svTheme);

  const isGoodWin = winner === SecretVillainWinner.Good;
  const isBadWin = winner === SecretVillainWinner.Bad;
  const isMyTeamGood = gameState.myRole?.team === Team.Good;

  const myTeamWon = (isGoodWin && isMyTeamGood) || (isBadWin && !isMyTeamGood);

  const heading = myTeamWon
    ? SECRET_VILLAIN_COPY.gameOver.victory
    : SECRET_VILLAIN_COPY.gameOver.defeat;

  const subheading = isGoodWin
    ? themeLabels.goodWins
    : isBadWin
      ? themeLabels.badWins
      : undefined;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-1">{heading}</h1>
      {subheading && (
        <p className="text-lg text-muted-foreground mb-1">{subheading}</p>
      )}
      {gameState.victoryCondition && (
        <p className="text-sm text-muted-foreground mb-6">
          {gameState.victoryCondition.label}
        </p>
      )}
      {!subheading && !gameState.victoryCondition && <div className="mb-6" />}
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {SECRET_VILLAIN_COPY.gameOver.rolesRevealHeading}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoleAssignmentList
            assignments={gameState.visibleRoleAssignments}
            themeLabels={themeLabels}
          />
        </CardContent>
      </Card>
      <Button
        className="w-full"
        variant="outline"
        onClick={onReturnToLobby}
        disabled={!!isReturning}
      >
        {SECRET_VILLAIN_COPY.gameOver.returnToLobby}
      </Button>
      {returnError && (
        <p className="text-destructive text-sm mt-2 text-center">
          {SECRET_VILLAIN_COPY.gameOver.returnToLobbyError}
        </p>
      )}
    </div>
  );
}
