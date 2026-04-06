"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game-modes/secret-villain/themes";
import type { SecretVillainPlayerGameState } from "@/lib/game-modes/secret-villain/player-state";
import type { VisibleTeammate } from "@/server/types";
import { Team } from "@/lib/types";
import { SecretVillainRole } from "@/lib/game-modes/secret-villain/roles";

export interface SecretVillainStartingViewProps {
  gameState: SecretVillainPlayerGameState;
  secondsRemaining?: number;
}

interface BadTeamRevealProps {
  teammates: VisibleTeammate[];
  specialBadMarker: string;
}

function BadTeamReveal({ teammates, specialBadMarker }: BadTeamRevealProps) {
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
              {role?.id === (SecretVillainRole.SpecialBad as string) && (
                <span className="text-muted-foreground">
                  {specialBadMarker}
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
  const isSpecialBad = myRole?.id === (SecretVillainRole.SpecialBad as string);
  const themeLabels = getSvThemeLabels(gameState.svTheme);

  const roleName =
    myRole?.id === (SecretVillainRole.Good as string)
      ? themeLabels.goodRole
      : myRole?.id === (SecretVillainRole.Bad as string)
        ? themeLabels.badRole
        : myRole?.id === (SecretVillainRole.SpecialBad as string)
          ? themeLabels.specialBadRole
          : (myRole?.name ?? "Unknown");
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
        <BadTeamReveal
          teammates={badTeammates}
          specialBadMarker={themeLabels.specialBadMarker}
        />
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
