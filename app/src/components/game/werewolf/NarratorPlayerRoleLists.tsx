"use client";

import type { ReactNode } from "react";
import { GAME_MODES } from "@/lib/game-modes";
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
import { RoleTooltip } from "@/components/lobby";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

interface NarratorPlayerRoleListsProps {
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
}: NarratorPlayerRoleListsProps) {
  if (assignments.length === 0) return null;

  const modeConfig = gameMode ? GAME_MODES[gameMode] : undefined;
  const deadSet = new Set(deadPlayerIds ?? []);
  const active = assignments.filter((a) => !deadSet.has(a.player.id));
  const eliminated = assignments.filter((a) => deadSet.has(a.player.id));
  const withFullRole = (a: VisibleTeammate) => ({
    ...a,
    fullRole: modeConfig?.roles[a.role.id],
  });
  const activeWithRole = active.map(withFullRole);
  const eliminatedWithRole = eliminated.map(withFullRole);

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Player Roles</CardTitle>
      </CardHeader>
      <CardContent>
        {activeWithRole.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">None</p>
        ) : (
          <ItemGroup>
            {activeWithRole.map(({ player, role, fullRole }) => (
              <Item key={player.id} size="sm">
                <ItemContent>
                  <ItemTitle>{player.name}</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <RoleLabel role={role} gameMode={gameMode} />
                  {fullRole && (
                    <RoleTooltip
                      role={fullRole}
                      srLabel={WEREWOLF_COPY.roleDisplay.roleInfoLabel}
                    />
                  )}
                  {renderActions?.(player.id, false)}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
        {eliminatedWithRole.length > 0 && (
          <>
            <div className="border-t my-3" />
            <p className="text-sm font-semibold mb-2 text-muted-foreground">
              Eliminated
            </p>
            <ItemGroup>
              {eliminatedWithRole.map(({ player, role, fullRole }) => (
                <Item key={player.id} size="sm">
                  <ItemContent>
                    <ItemTitle className="italic text-muted-foreground line-through">
                      {player.name}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <RoleLabel role={role} gameMode={gameMode} />
                    {fullRole && (
                      <RoleTooltip
                        role={fullRole}
                        srLabel={WEREWOLF_COPY.roleDisplay.roleInfoLabel}
                      />
                    )}
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
