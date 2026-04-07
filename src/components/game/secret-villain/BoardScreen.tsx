"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { FAILED_ELECTION_THRESHOLD } from "@/lib/game/modes/secret-villain/types";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import type { PublicLobbyPlayer } from "@/server/types/lobby";
import { BoardDisplay } from "./BoardDisplay";

function getPlayerName(players: PublicLobbyPlayer[], playerId: string): string {
  return players.find((p) => p.id === playerId)?.name ?? playerId;
}

export interface BoardScreenProps {
  gameState: SecretVillainPlayerGameState;
}

export function BoardScreen({ gameState }: BoardScreenProps) {
  const { svPhase, svBoard, players, deadPlayerIds, vetoUnlocked, svTheme } =
    gameState;

  const phaseLabel = svPhase?.type
    ? SECRET_VILLAIN_COPY.boardScreen.phaseLabels[svPhase.type]
    : undefined;

  const presidentName = svPhase?.presidentId
    ? getPlayerName(players, svPhase.presidentId)
    : undefined;

  const chancellorName = svPhase?.chancellorId
    ? getPlayerName(players, svPhase.chancellorId)
    : undefined;

  const chancellorNomineeName = svPhase?.chancellorNomineeId
    ? getPlayerName(players, svPhase.chancellorNomineeId)
    : undefined;

  const eliminatedIds = deadPlayerIds ?? [];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">
        {SECRET_VILLAIN_COPY.boardScreen.heading}
      </h1>

      {svBoard?.powerTable && (
        <BoardDisplay
          goodCardsPlayed={svBoard.goodCardsPlayed}
          badCardsPlayed={svBoard.badCardsPlayed}
          failedElectionCount={svBoard.failedElectionCount}
          failedElectionThreshold={FAILED_ELECTION_THRESHOLD}
          powerTable={svBoard.powerTable}
          vetoUnlocked={vetoUnlocked}
          svTheme={svTheme}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.boardScreen.currentPhase}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {phaseLabel && (
            <Badge variant="secondary" data-testid="phase-badge">
              {phaseLabel}
            </Badge>
          )}
          {presidentName && (
            <p className="text-sm" data-testid="president-name">
              <span className="font-medium">
                {SECRET_VILLAIN_COPY.boardScreen.president}:
              </span>{" "}
              {presidentName}
            </p>
          )}
          {chancellorNomineeName && !chancellorName && (
            <p className="text-sm" data-testid="chancellor-nominee-name">
              <span className="font-medium">
                {SECRET_VILLAIN_COPY.boardScreen.chancellorNominee}:
              </span>{" "}
              {chancellorNomineeName}
            </p>
          )}
          {chancellorName && (
            <p className="text-sm" data-testid="chancellor-name">
              <span className="font-medium">
                {SECRET_VILLAIN_COPY.boardScreen.chancellor}:
              </span>{" "}
              {chancellorName}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{SECRET_VILLAIN_COPY.boardScreen.eliminated}</CardTitle>
        </CardHeader>
        <CardContent>
          {eliminatedIds.length === 0 ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="no-eliminated"
            >
              {SECRET_VILLAIN_COPY.boardScreen.noEliminated}
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {eliminatedIds.map((id, i) => (
                <li key={id} data-testid={`eliminated-player-${String(i)}`}>
                  {getPlayerName(players, id)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
