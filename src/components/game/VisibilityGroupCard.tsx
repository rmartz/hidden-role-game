"use client";

import type { ReactNode } from "react";
import { TargetRegular } from "@fluentui/react-icons";
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
import { WerewolfRole } from "@/lib/game/modes/werewolf/roles";
import {
  PLAYER_VISIBILITY_COPY,
  ROLE_VISIBILITY_OVERRIDES,
  LONE_WOLF_WARNING,
  LONE_WOLF_WARNING_ROLES,
} from "@/components/game/PlayersRoleList.copy";

export const REASON_CONFIG: Record<
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

export interface VisibilityGroupCardProps {
  reason: VisibilityReason;
  entries: VisibleTeammate[];
  gameMode?: GameMode;
  executionerTargetId?: string;
  myRoleId?: string;
  rolesInPlay?: { id: string }[];
  renderActions?: (
    playerId: string,
    playerName: string,
    isDead: boolean,
  ) => ReactNode;
}

export function VisibilityGroupCard({
  reason,
  entries,
  gameMode,
  executionerTargetId,
  myRoleId,
  rolesInPlay,
  renderActions,
}: VisibilityGroupCardProps) {
  const baseConfig = REASON_CONFIG[reason];
  const overrides = myRoleId
    ? (
        ROLE_VISIBILITY_OVERRIDES as Record<
          string,
          (typeof ROLE_VISIBILITY_OVERRIDES)[keyof typeof ROLE_VISIBILITY_OVERRIDES]
        >
      )[myRoleId]
    : undefined;
  const heading =
    reason === "wake-partner"
      ? (overrides?.wakePartnerHeading ?? baseConfig.heading)
      : reason === "aware-of"
        ? (overrides?.awareOfHeading ?? baseConfig.heading)
        : baseConfig.heading;
  const loneWolfVisible =
    reason === "wake-partner" &&
    myRoleId !== undefined &&
    LONE_WOLF_WARNING_ROLES.has(myRoleId) &&
    rolesInPlay?.some((r) => r.id === (WerewolfRole.LoneWolf as string));
  const baseDescription =
    reason === "wake-partner"
      ? (overrides?.wakePartnerDescription ?? baseConfig.description)
      : reason === "aware-of"
        ? (overrides?.awareOfDescription ?? baseConfig.description)
        : baseConfig.description;
  const description =
    loneWolfVisible && baseDescription
      ? baseDescription + LONE_WOLF_WARNING
      : baseDescription;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-2">
          <p className="text-sm font-semibold">{heading}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <ItemGroup>
          {entries.map(({ player, role }) => (
            <Item key={player.id} size="sm">
              <ItemContent>
                <ItemTitle>
                  {player.name}
                  {executionerTargetId === player.id && (
                    <TargetRegular className="inline ml-1 text-amber-500" />
                  )}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                {role ? <RoleLabel role={role} gameMode={gameMode} /> : null}
                {renderActions?.(player.id, player.name, false)}
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
