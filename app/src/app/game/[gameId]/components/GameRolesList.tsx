import type { GameMode } from "@/lib/models";
import type { PublicRoleInfo } from "@/server/models";
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
    <div style={{ marginBottom: "20px" }}>
      <h2>Roles In Play</h2>
      <ul>
        {roles.map((r) => {
          const isSelected = r.id === selectedRoleId;
          return (
            <li
              key={r.id}
              onClick={() => onSelectedIdChange?.(r.id)}
              style={{
                cursor: onSelectedIdChange ? "pointer" : undefined,
                fontWeight: isSelected ? "bold" : undefined,
                outline: isSelected ? "2px solid currentColor" : undefined,
                padding: "2px 4px",
                borderRadius: "4px",
              }}
            >
              <RoleLabel role={r} gameMode={gameMode} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
