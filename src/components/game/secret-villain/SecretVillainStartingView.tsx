"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game/modes/secret-villain/themes";
import type { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import type { VisibleTeammate } from "@/server/types";
import { Team } from "@/lib/types";
import { SecretVillainRole } from "@/lib/game/modes/secret-villain/roles";

export interface SecretVillainStartingViewProps {
  gameState: SecretVillainPlayerGameState;
  secondsRemaining?: number;
}

interface BadTeamRevealProps {
  teammates: VisibleTeammate[];
  svTheme?: SvTheme;
  description?: string;
}

function BadTeamReveal({
  teammates,
  svTheme,
  description,
}: BadTeamRevealProps) {
  const themeLabels = getSvThemeLabels(svTheme);
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm">{themeLabels.badTeamHeading}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {description ?? themeLabels.badTeamDescription}
        </p>
        <ul className="text-sm space-y-1">
          {teammates.map(({ player, role }) => (
            <li key={player.id} className="flex justify-between gap-4">
              <span>{player.name}</span>
              {role?.id === (SecretVillainRole.SpecialBad as string) && (
                <span className="text-muted-foreground">
                  {themeLabels.specialBadMarker}
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
    ? themeLabels.specialBadMessage
    : isBadTeam
      ? themeLabels.badTeamDescription
      : themeLabels.goodTeamMessage;

  const badAllyDescription = isSpecialBad
    ? themeLabels.specialBadAllyDescription
    : undefined;

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">
        {SECRET_VILLAIN_COPY.starting.heading}
      </h1>
      <p className="text-lg mb-4">
        {SECRET_VILLAIN_COPY.starting.yourRole(roleName)}
      </p>
      {isBadTeam && badTeammates.length > 0 && (
        <BadTeamReveal
          teammates={badTeammates}
          svTheme={gameState.svTheme}
          description={badAllyDescription}
        />
      )}
      {(!isBadTeam || (isSpecialBad && badTeammates.length === 0)) && (
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
