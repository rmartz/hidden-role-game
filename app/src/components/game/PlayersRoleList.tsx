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

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Player Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {assignments.map((t) => {
            const isDead = deadSet.has(t.player.id);
            return (
              <Item key={t.player.id} size="sm">
                <ItemContent>
                  <ItemTitle
                    className={
                      isDead ? "italic text-muted-foreground line-through" : ""
                    }
                  >
                    {t.player.name}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <RoleLabel role={t.role} gameMode={gameMode} />
                  {renderActions?.(t.player.id, isDead)}
                </ItemActions>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
