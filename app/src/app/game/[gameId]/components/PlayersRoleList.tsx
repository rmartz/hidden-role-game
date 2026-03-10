import type { GameMode } from "@/lib/models";
import type { VisibleTeammate } from "@/server/models";
import { RoleLabel } from "./RoleLabel";

interface Props {
  assignments: VisibleTeammate[];
  gameMode?: GameMode;
}

export function PlayersRoleList({ assignments, gameMode }: Props) {
  if (assignments.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>Player Roles</h2>
      <ul>
        {assignments.map((t) => (
          <li key={t.player.id}>
            {t.player.name} — <RoleLabel role={t.role} gameMode={gameMode} />
          </li>
        ))}
      </ul>
    </div>
  );
}
