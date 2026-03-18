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
  const active = assignments.filter((a) => !deadSet.has(a.player.id));
  const eliminated = assignments.filter((a) => deadSet.has(a.player.id));

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Player Roles</CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">None</p>
        ) : (
          <ItemGroup>
            {active.map(({ player, role }) => (
              <Item key={player.id} size="sm">
                <ItemContent>
                  <ItemTitle>{player.name}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  {role ? <RoleLabel role={role} gameMode={gameMode} /> : null}
                  {renderActions?.(player.id, false)}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
        {eliminated.length > 0 && (
          <>
            <div className="border-t my-3" />
            <p className="text-sm font-semibold mb-2 text-muted-foreground">
              Eliminated
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
                    {renderActions?.(player.id, true)}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </>
        )}
      </CardContent>
    </Card>
  );
}
