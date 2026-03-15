import type { ReactNode } from "react";
import type { GameMode } from "@/lib/types";
import type { VisibleTeammate } from "@/server/types";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleLabel } from "@/components/RoleLabel";

interface Props {
  assignments: VisibleTeammate[];
  gameMode?: GameMode;
  deadPlayerIds?: string[];
  /** Optional render prop for per-player action buttons (e.g., kill/revive). */
  renderActions?: (playerId: string, isDead: boolean) => ReactNode;
}

export function PlayersRoleList({
  assignments,
  gameMode,
  deadPlayerIds,
  renderActions,
}: Props) {
  if (assignments.length === 0) return null;

  const deadSet = new Set(deadPlayerIds ?? []);
  const enriched = assignments.map((t) => ({
    ...t,
    isDead: deadSet.has(t.player.id),
  }));

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Player Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {enriched.map(({ player, role, isDead }) => (
            <Item key={player.id} size="sm">
              <ItemContent>
                <ItemTitle
                  className={
                    isDead ? "italic text-muted-foreground line-through" : ""
                  }
                >
                  {player.name}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                <RoleLabel role={role} gameMode={gameMode} />
                {renderActions?.(player.id, isDead)}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
