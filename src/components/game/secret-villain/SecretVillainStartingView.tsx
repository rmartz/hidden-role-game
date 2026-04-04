"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import type { PlayerGameState, VisibleTeammate } from "@/server/types";
import { Team } from "@/lib/types";

export interface SecretVillainStartingViewProps {
  gameState: PlayerGameState;
  secondsRemaining?: number;
}

function BadTeamReveal({ teammates }: { teammates: VisibleTeammate[] }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm">
          {SECRET_VILLAIN_COPY.starting.badTeamHeading}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {SECRET_VILLAIN_COPY.starting.badTeamDescription}
        </p>
        <ul className="text-sm space-y-1">
          {teammates.map(({ player, role }) => (
            <li key={player.id} className="flex justify-between gap-4">
              <span>{player.name}</span>
              {role?.id === "special-bad" && (
                <span className="text-muted-foreground">
                  {SECRET_VILLAIN_COPY.starting.specialBadMarker}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function SecretVillainStartingView({
  gameState,
  secondsRemaining,
}: SecretVillainStartingViewProps) {
  const myRole = gameState.myRole;
  const isBadTeam = myRole?.team === Team.Bad;
  const isSpecialBad = myRole?.id === "special-bad";

  const roleName = myRole?.name ?? "Unknown";
  const badTeammates = gameState.visibleRoleAssignments.filter(
    (a) => a.reason === "aware-of" || a.reason === "wake-partner",
  );

  const roleMessage = isSpecialBad
    ? SECRET_VILLAIN_COPY.starting.specialBadMessage
    : isBadTeam
      ? SECRET_VILLAIN_COPY.starting.badTeamDescription
      : SECRET_VILLAIN_COPY.starting.goodTeamMessage;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        {SECRET_VILLAIN_COPY.starting.heading}
      </h1>
      <p className="text-lg mb-4">
        {SECRET_VILLAIN_COPY.starting.yourRole(roleName)}
      </p>
      {isBadTeam && !isSpecialBad && badTeammates.length > 0 && (
        <BadTeamReveal teammates={badTeammates} />
      )}
      {(isSpecialBad || !isBadTeam) && (
        <p className="text-sm text-muted-foreground mb-4">{roleMessage}</p>
      )}
      {secondsRemaining !== undefined && secondsRemaining > 0 && (
        <p className="text-sm text-muted-foreground">
          {SECRET_VILLAIN_COPY.starting.gameStartsIn}{" "}
          <strong>{secondsRemaining}s</strong>
        </p>
      )}
    </div>
  );
}
