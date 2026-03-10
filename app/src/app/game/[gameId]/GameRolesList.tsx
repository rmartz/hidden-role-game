import type { GameMode } from "@/lib/models";
import type { PublicRoleInfo } from "@/server/models";
import RoleLabel from "./RoleLabel";

interface Props {
  roles: PublicRoleInfo[];
  gameMode?: GameMode;
}

export default function GameRolesList({ roles, gameMode }: Props) {
  if (roles.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>Roles In Play</h2>
      <ul>
        {roles.map((r) => (
          <li key={r.id}>
            <RoleLabel role={r} gameMode={gameMode} />
          </li>
        ))}
      </ul>
    </div>
  );
}
