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
import { WerewolfRole } from "@/lib/game-modes/werewolf/roles";
import {
  PLAYER_VISIBILITY_COPY,
  ROLE_VISIBILITY_OVERRIDES,
  LONE_WOLF_WARNING,
  LONE_WOLF_WARNING_ROLES,
} from "@/components/game/PlayersRoleList.copy";

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
      {activeGroups.map(({ reason, entries }) => {
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
          <Card key={reason}>
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
