import type { GameMode } from "@/lib/types";
import type { RoleInPlay } from "@/server/types";
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

  function countPrefix(r: RoleInPlay): string {
    if (r.count !== undefined) return `${String(r.count)}× `;
    if (r.min !== r.max) return `${String(r.min)}–${String(r.max)} `;
    return "";
  }

  const enriched = roles.map((r) => ({
    ...r,
    isSelected: r.id === selectedRoleId,
    prefix: countPrefix(r),
  }));

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle>Roles In Play</CardTitle>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {enriched.map((r) => (
            <Item
              key={r.id}
              size="sm"
              variant={r.isSelected ? "muted" : "default"}
              onClick={() => onSelectedIdChange?.(r.id)}
              className={onSelectedIdChange ? "cursor-pointer" : undefined}
            >
              <ItemContent>
                <ItemTitle>
                  {r.prefix}
                  <RoleLabel role={r} gameMode={gameMode} />
                </ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
