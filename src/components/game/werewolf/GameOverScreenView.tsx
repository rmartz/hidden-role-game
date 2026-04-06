"use client";

import { Team } from "@/lib/types";
import type { FinishedGameStatus } from "@/lib/types";
import { WerewolfWinner } from "@/lib/game/modes/werewolf/utils/win-condition";
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import type { PlayerGameState, VisibleTeammate } from "@/server/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface GameOverScreenViewProps {
  gameState: PlayerGameState;
  onReturnToLobby: () => void;
  isReturning?: boolean;
  returnError?: boolean;
}

function isVictory(
  winner: string | undefined,
  myRole: PlayerGameState["myRole"],
  amDead?: boolean,
): boolean {
  if (!winner || !myRole) return false;
  if (winner === WerewolfWinner.Village) return myRole.team === Team.Good;
  if (winner === WerewolfWinner.Werewolves) return myRole.team === Team.Bad;
  if (winner === WerewolfWinner.Chupacabra)
    return myRole.id === (WerewolfRole.Chupacabra as string);
  if (winner === WerewolfWinner.LoneWolf)
    return myRole.id === (WerewolfRole.LoneWolf as string) && !amDead;
  if (winner === WerewolfWinner.Tanner)
    return myRole.id === (WerewolfRole.Tanner as string);
  if (winner === WerewolfWinner.Spoiler)
    return myRole.id === (WerewolfRole.Spoiler as string);
  if (winner === WerewolfWinner.Executioner)
    return myRole.id === (WerewolfRole.Executioner as string);
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
          {role && <span className="text-muted-foreground">{role.name}</span>}
        </li>
      ))}
    </ul>
  );
}

export function GameOverScreenView({
  gameState,
  onReturnToLobby,
  isReturning,
  returnError,
}: GameOverScreenViewProps) {
  const finishedStatus = gameState.status as FinishedGameStatus;
  const { winner } = finishedStatus;
  const victory = isVictory(winner, gameState.myRole, gameState.amDead);

  const isDraw = winner === WerewolfWinner.Draw;
  const heading =
    gameState.myRole === undefined
      ? winner
        ? isDraw
          ? WEREWOLF_COPY.gameOver.draw
          : WEREWOLF_COPY.gameOver.winnerLabel(winner)
        : WEREWOLF_COPY.gameOver.defeat
      : isDraw
        ? WEREWOLF_COPY.gameOver.draw
        : victory
          ? WEREWOLF_COPY.gameOver.victory
          : WEREWOLF_COPY.gameOver.defeat;

  const subheading =
    winner && !isDraw && gameState.myRole !== undefined
      ? WEREWOLF_COPY.gameOver.winnerLabel(winner)
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
            {WEREWOLF_COPY.gameOver.rolesRevealHeading}
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
        {WEREWOLF_COPY.gameOver.returnToLobby}
      </Button>
      {returnError && (
        <p className="text-destructive text-sm mt-2 text-center">
          {WEREWOLF_COPY.gameOver.returnToLobbyError}
        </p>
      )}
    </div>
  );
}
