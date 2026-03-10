import type { GameMode } from "@/lib/models";
import type { PublicRoleInfo } from "@/server/models";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";
import { RoleLabel } from "./RoleLabel";

interface Props {
  roles: PublicRoleInfo[];
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
    <div className="mb-5">
      <h2 className="text-lg font-semibold mb-2">Roles In Play</h2>
      <ItemGroup>
        {roles.map((r) => {
          const isSelected = r.id === selectedRoleId;
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
                  <RoleLabel role={r} gameMode={gameMode} />
                </ItemTitle>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </div>
  );
}
