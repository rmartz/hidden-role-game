import type { PublicRoleInfo } from "@/server/models";

interface Props {
  role: PublicRoleInfo;
}

export default function PlayerRole({ role }: Props) {
  return (
    <p>
      <strong>{role.name}</strong> — Team: {role.team}
    </p>
  );
}
