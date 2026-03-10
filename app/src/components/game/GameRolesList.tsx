import type { GameMode } from "@/lib/models";
import type { RoleInPlay } from "@/server/models";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleLabel } from "@/components/RoleLabel";

interface Props {
  roles: RoleInPlay[];
  gameMode?: GameMode;
  selectedRoleId?: string;
  onSelectedIdChange?: (id: string) => void;
}

export function GameRolesList({
  roles,
  gameMode,
  selectedRoleId,
  onSelectedIdChange,
}: Props) {
  if (roles.length === 0) return null;

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Roles In Play</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            const prefix =
              r.count !== undefined
                ? `${String(r.count)}× `
                : r.min !== r.max
                  ? `${String(r.min)}–${String(r.max)} `
                  : "";
            return (
              <Item
                key={r.id}
                size="sm"
                variant={isSelected ? "muted" : "default"}
                onClick={() => onSelectedIdChange?.(r.id)}
                className={onSelectedIdChange ? "cursor-pointer" : undefined}
              >
                <ItemContent>
                  <ItemTitle>
                    {prefix}
                    <RoleLabel role={r} gameMode={gameMode} />
                  </ItemTitle>
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
