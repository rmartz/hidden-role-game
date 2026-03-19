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
import { PLAYER_VISIBILITY_COPY } from "@/components/game/copy";

interface PlayersRoleListProps {
  assignments: VisibleTeammate[];
  gameMode?: GameMode;
  deadPlayerIds?: string[];
  /** Optional render prop for per-player action buttons. */
  renderActions?: (
    playerId: string,
    playerName: string,
    isDead: boolean,
  ) => ReactNode;
}

const REASON_CONFIG: Record<
  VisibilityReason,
  { heading: string; description?: string }
> = {
  "wake-partner": {
    heading: PLAYER_VISIBILITY_COPY.wakePartnerHeading,
    description: PLAYER_VISIBILITY_COPY.wakePartnerDescription,
  },
  "aware-of": {
    heading: PLAYER_VISIBILITY_COPY.awareOfHeading,
    description: PLAYER_VISIBILITY_COPY.awareOfDescription,
  },
  revealed: {
    heading: PLAYER_VISIBILITY_COPY.revealedHeading,
  },
};

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
  renderActions,
}: PlayersRoleListProps) {
  if (assignments.length === 0) return null;

  const deadSet = new Set(deadPlayerIds ?? []);
  const active = assignments.filter((a) => !deadSet.has(a.player.id));
  const eliminated = assignments.filter((a) => deadSet.has(a.player.id));
  const activeGroups = groupByReason(active);

  return (
    <div className="space-y-4 mb-5">
      {activeGroups.map(({ reason, entries }) => {
        const config = REASON_CONFIG[reason];
        return (
          <Card key={reason}>
            <CardContent className="pt-4">
              <div className="mb-2">
                <p className="text-sm font-semibold">{config.heading}</p>
                {config.description && (
                  <p className="text-xs text-muted-foreground">
                    {config.description}
                  </p>
                )}
              </div>
              <ItemGroup>
                {entries.map(({ player, role }) => (
                  <Item key={player.id} size="sm">
                    <ItemContent>
                      <ItemTitle>{player.name}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      {role ? (
                        <RoleLabel role={role} gameMode={gameMode} />
                      ) : null}
                      {renderActions?.(player.id, player.name, false)}
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>
        );
      })}
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
