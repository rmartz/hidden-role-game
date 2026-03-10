import type { GameMode } from "@/lib/models";
import type { VisibleTeammate } from "@/server/models";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { RoleLabel } from "./RoleLabel";

interface Props {
  assignments: VisibleTeammate[];
  gameMode?: GameMode;
}

export function PlayersRoleList({ assignments, gameMode }: Props) {
  if (assignments.length === 0) return null;

  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Player Roles</h2>
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
    </div>
  );
}
