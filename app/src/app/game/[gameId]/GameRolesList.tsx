import type { PublicRoleInfo } from "@/server/models";

interface Props {
  roles: PublicRoleInfo[];
}

export default function GameRolesList({ roles }: Props) {
  if (roles.length === 0) return null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>Roles In Play</h2>
      <ul>
        {roles.map((r) => (
          <li key={r.id}>
            {r.name} — {r.team}
          </li>
        ))}
      </ul>
    </div>
  );
}
