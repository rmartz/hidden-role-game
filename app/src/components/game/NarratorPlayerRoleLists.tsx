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

export function NarratorPlayerRoleLists({
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
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-start gap-4 mb-5">
      <Card>
        <CardHeader>
          <CardTitle>Active Player Roles</CardTitle>
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
                    <RoleLabel role={role} gameMode={gameMode} />
                    {renderActions?.(player.id, false)}
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
      {eliminated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eliminated</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {eliminated.map(({ player, role }) => (
                <Item key={player.id} size="sm">
                  <ItemContent>
                    <ItemTitle className="italic text-muted-foreground line-through">
                      {player.name}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <RoleLabel role={role} gameMode={gameMode} />
                    {renderActions?.(player.id, true)}
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
