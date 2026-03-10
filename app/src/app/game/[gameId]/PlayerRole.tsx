import { GAME_MODES } from "@/lib/game-modes";
import type { GameMode } from "@/lib/models";
import type { PublicRoleInfo } from "@/server/models";

interface Props {
  player: PublicRoleInfo;
  gameMode?: GameMode;
}

export default function PlayerRole({ player, gameMode }: Props) {
  const teamLabels = gameMode ? GAME_MODES[gameMode].teamLabels : undefined;
  const teamLabel = teamLabels?.[player.team] ?? player.team;
  return (
    <>
      {player.name} ({teamLabel})
    </>
  );
}
