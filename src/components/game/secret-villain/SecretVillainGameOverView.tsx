"use client";

import { Team } from "@/lib/types";
import type { FinishedGameStatus } from "@/lib/types";
import { SecretVillainWinner } from "@/lib/game-modes/secret-villain/utils/win-condition";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import type { PlayerGameState, VisibleTeammate } from "@/server/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SecretVillainGameOverViewProps {
  gameState: PlayerGameState;
  onReturnToLobby: () => void;
  isReturning?: boolean;
  returnError?: boolean;
}

interface RoleAssignmentListProps {
  assignments: VisibleTeammate[];
}

function RoleAssignmentList({ assignments }: RoleAssignmentListProps) {
  if (assignments.length === 0) return null;
  return (
    <ul className="text-sm space-y-1">
      {assignments.map(({ player, role }) => (
        <li key={player.id} className="flex justify-between gap-4">
          <span>{player.name}</span>
          {role && <span className="text-muted-foreground">{role.name}</span>}
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

  const isGoodWin = winner === SecretVillainWinner.Good;
  const isBadWin = winner === SecretVillainWinner.Bad;
  const isMyTeamGood = gameState.myRole?.team === Team.Good;

  const myTeamWon = (isGoodWin && isMyTeamGood) || (isBadWin && !isMyTeamGood);

  const heading = myTeamWon
    ? SECRET_VILLAIN_COPY.gameOver.victory
    : SECRET_VILLAIN_COPY.gameOver.defeat;

  const subheading = isGoodWin
    ? SECRET_VILLAIN_COPY.gameOver.goodWins
    : isBadWin
      ? SECRET_VILLAIN_COPY.gameOver.badWins
      : undefined;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-1">{heading}</h1>
      {subheading && (
        <p className="text-lg text-muted-foreground mb-6">{subheading}</p>
      )}
      {!subheading && <div className="mb-6" />}
      <Card className="mb-4">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {SECRET_VILLAIN_COPY.gameOver.rolesRevealHeading}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoleAssignmentList assignments={gameState.visibleRoleAssignments} />
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
