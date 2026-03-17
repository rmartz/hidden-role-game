"use client";

import { Team } from "@/lib/types";
import type { FinishedGameStatus } from "@/lib/types";
import { WerewolfWinner } from "@/lib/game-modes/werewolf/utils/win-condition";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";
import type { PlayerGameState, VisibleTeammate } from "@/server/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GameOverScreenProps {
  gameState: PlayerGameState;
}

function isVictory(
  winner: string | undefined,
  myRole: PlayerGameState["myRole"],
): boolean {
  if (!winner || !myRole) return false;
  if (winner === WerewolfWinner.Village) return myRole.team === Team.Good;
  if (winner === WerewolfWinner.Werewolves) return myRole.team === Team.Bad;
  if (winner === WerewolfWinner.Chupacabra) return myRole.team === Team.Neutral;
  return false;
}

function RoleAssignmentList({
  assignments,
}: {
  assignments: VisibleTeammate[];
}) {
  if (assignments.length === 0) return null;
  return (
    <ul className="text-sm space-y-1">
      {assignments.map(({ player, role }) => (
        <li key={player.id} className="flex justify-between gap-4">
          <span>{player.name}</span>
          <span className="text-muted-foreground">{role.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function GameOverScreen({ gameState }: GameOverScreenProps) {
  const finishedStatus = gameState.status as FinishedGameStatus;
  const { winner } = finishedStatus;
  const victory = isVictory(winner, gameState.myRole);

  const heading =
    gameState.myRole === undefined
      ? winner
        ? WEREWOLF_COPY.gameOver.winnerLabel(winner)
        : WEREWOLF_COPY.gameOver.defeat
      : victory
        ? WEREWOLF_COPY.gameOver.victory
        : WEREWOLF_COPY.gameOver.defeat;

  const subheading =
    winner && gameState.myRole !== undefined
      ? WEREWOLF_COPY.gameOver.winnerLabel(winner)
      : undefined;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-1">{heading}</h1>
      {subheading && (
        <p className="text-lg text-muted-foreground mb-6">{subheading}</p>
      )}
      {!subheading && <div className="mb-6" />}
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {WEREWOLF_COPY.gameOver.rolesRevealHeading}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoleAssignmentList assignments={gameState.visibleRoleAssignments} />
        </CardContent>
      </Card>
    </div>
  );
}
