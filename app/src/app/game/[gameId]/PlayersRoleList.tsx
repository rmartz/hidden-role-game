import type { Team } from "@/lib/models";
import type { VisibleTeammate } from "@/server/models";

interface Props {
  assignments: VisibleTeammate[];
  teamLabels?: Partial<Record<Team, string>>;
}

export default function PlayersRoleList({ assignments, teamLabels }: Props) {
  if (assignments.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>Player Roles</h2>
      <ul>
        {assignments.map((t) => (
          <li key={t.player.id}>
            {t.player.name} — {t.role.name} (
            {teamLabels?.[t.role.team] ?? t.role.team})
          </li>
        ))}
      </ul>
    </div>
  );
}
