"use client";

import type { ReactNode } from "react";
import type { GameMode } from "@/lib/types";
import type { VisibilityReason, VisibleTeammate } from "@/server/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Card, CardContent } from "@/components/ui/card";
import { RoleLabel } from "@/components/RoleLabel";
import { PLAYER_VISIBILITY_COPY } from "@/components/game/PlayersRoleList.copy";
import { VisibilityGroupCard } from "@/components/game/VisibilityGroupCard";

interface PlayersRoleListProps {
  assignments: VisibleTeammate[];
  gameMode?: GameMode;
  deadPlayerIds?: string[];
  /** Player ID of the Executioner's target. Shows a target icon when set. */
  executionerTargetId?: string;
  /** The current player's role ID. Used to customize visibility section text. */
  myRoleId?: string;
  /** Roles configured in the game. Used to check if Lone Wolf could be present. */
  rolesInPlay?: { id: string }[];
  /** Optional render prop for per-player action buttons. */
  renderActions?: (
    playerId: string,
    playerName: string,
    isDead: boolean,
  ) => ReactNode;
}

const REASON_ORDER: VisibilityReason[] = [
  "wake-partner",
  "aware-of",
  "revealed",
];

function groupByReason(
  assignments: VisibleTeammate[],
): { reason: VisibilityReason; entries: VisibleTeammate[] }[] {
  const map = new Map<VisibilityReason, VisibleTeammate[]>();
  for (const a of assignments) {
    const list = map.get(a.reason);
    if (list) {
      list.push(a);
    } else {
      map.set(a.reason, [a]);
    }
  }
  return REASON_ORDER.filter((r) => map.has(r)).map((r) => ({
    reason: r,
    entries: map.get(r) ?? [],
  }));
}

export function PlayersRoleList({
  assignments,
  gameMode,
  deadPlayerIds,
  executionerTargetId,
  myRoleId,
  rolesInPlay,
  renderActions,
}: PlayersRoleListProps) {
  if (assignments.length === 0) return null;

  const deadSet = new Set(deadPlayerIds ?? []);
  const active = assignments.filter((a) => !deadSet.has(a.player.id));
  const eliminated = assignments.filter((a) => deadSet.has(a.player.id));
  const activeGroups = groupByReason(active);

  return (
    <div className="space-y-4 mb-5">
      {activeGroups.map(({ reason, entries }) => (
        <VisibilityGroupCard
          key={reason}
          reason={reason}
          entries={entries}
          gameMode={gameMode}
          executionerTargetId={executionerTargetId}
          myRoleId={myRoleId}
          rolesInPlay={rolesInPlay}
          renderActions={renderActions}
        />
      ))}
      {eliminated.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm font-semibold mb-2 text-muted-foreground">
              {PLAYER_VISIBILITY_COPY.revealedHeading}
            </p>
            <ItemGroup>
              {eliminated.map(({ player, role }) => (
                <Item key={player.id} size="sm">
                  <ItemContent>
                    <ItemTitle className="italic text-muted-foreground line-through">
                      {player.name}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    {role ? (
                      <RoleLabel role={role} gameMode={gameMode} />
                    ) : null}
                    {renderActions?.(player.id, player.name, true)}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
