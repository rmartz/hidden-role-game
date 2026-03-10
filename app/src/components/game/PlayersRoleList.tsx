import type { GameMode } from "@/lib/models";
import type { VisibleTeammate } from "@/server/models";
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
}

export function PlayersRoleList({ assignments, gameMode }: Props) {
  if (assignments.length === 0) return null;

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Player Roles</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {assignments.map((t) => (
            <Item key={t.player.id} size="sm">
              <ItemContent>
                <ItemTitle>{t.player.name}</ItemTitle>
              </ItemContent>
              <ItemActions>
                <RoleLabel role={t.role} gameMode={gameMode} />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
