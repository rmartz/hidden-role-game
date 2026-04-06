import type { PublicLobbyPlayer, VisibleTeammate } from "@/server/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

interface PlayerStatusListsProps {
  players: PublicLobbyPlayer[];
  deadPlayerIds: string[];
  /** ID of the game owner (narrator) to exclude from the lists. */
  gameOwnerId?: string;
  /** Known role assignments — if provided, role is shown next to eliminated players. */
  roleAssignments?: VisibleTeammate[];
}

export function PlayerStatusLists({
  players,
  deadPlayerIds,
  gameOwnerId,
  roleAssignments,
}: PlayerStatusListsProps) {
  const deadSet = new Set(deadPlayerIds);
  const filtered = players.filter((p) => p.id !== gameOwnerId);
  const activePlayers = filtered.filter((p) => !deadSet.has(p.id));
  const deadPlayers = filtered.filter((p) => deadSet.has(p.id));

  const roleMap = new Map(
    (roleAssignments ?? [])
      .filter(
        (a): a is typeof a & { role: NonNullable<typeof a.role> } =>
          a.role !== undefined,
      )
      .map((a) => [a.player.id, a.role.name]),
  );

  return (
    <div className="grid grid-cols-2 gap-4 mb-5">
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {WEREWOLF_COPY.playerLists.activePlayers(activePlayers.length)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {WEREWOLF_COPY.playerLists.none}
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {activePlayers.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm">
            {WEREWOLF_COPY.playerLists.eliminated(deadPlayers.length)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deadPlayers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {WEREWOLF_COPY.playerLists.noneYet}
            </p>
          ) : (
            <ul className="text-sm space-y-1">
              {deadPlayers.map((p) => {
                const roleName = roleMap.get(p.id);
                return (
                  <li key={p.id} className="text-muted-foreground">
                    {p.name}
                    {roleName && (
                      <span className="text-xs ml-1">({roleName})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
