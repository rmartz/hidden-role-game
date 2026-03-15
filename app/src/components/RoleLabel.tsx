import { GAME_MODES } from "@/lib/game-modes";
import type { GameMode } from "@/lib/types";
import type { PublicRoleInfo } from "@/server/types";
import { Badge } from "@/components/ui/badge";

interface RoleLabelProps {
  role: PublicRoleInfo;
  gameMode?: GameMode;
}

export function RoleLabel({ role, gameMode }: RoleLabelProps) {
  const teamLabels = gameMode ? GAME_MODES[gameMode].teamLabels : undefined;
  const teamLabel = teamLabels?.[role.team] ?? role.team;
  return (
    <Badge variant="secondary">
      {role.name}&nbsp;({teamLabel})
    </Badge>
  );
}
