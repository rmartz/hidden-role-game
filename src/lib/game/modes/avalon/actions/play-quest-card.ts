import { isEnumValue } from "@/lib/enum";
import type { Game, GameAction } from "@/lib/types";
import { Team } from "@/lib/types";

import { AVALON_ROLES, AvalonRole } from "../roles";
import { AvalonPhase, QuestCard } from "../types";
import { currentTurnState } from "../utils";

function isGoodPlayer(game: Game, playerId: string): boolean {
  const roleId = game.roleAssignments.find(
    (a) => a.playerId === playerId,
  )?.roleDefinitionId;
  if (!isEnumValue(AvalonRole, roleId)) return false;
  return AVALON_ROLES[roleId].team === Team.Good;
}

export const playQuestCardAction: GameAction = {
  isValid(game: Game, callerId: string, payload: unknown) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.Quest) return false;
    // Cards are locked in once the quest is resolved
    if (ts.phase.failCount !== undefined) return false;
    // Only team members may play
    if (!ts.phase.teamPlayerIds.includes(callerId)) return false;
    // No replaying
    if (ts.phase.cards.some((c) => c.playerId === callerId)) return false;

    if (!payload || typeof payload !== "object") return false;
    const { card } = payload as { card?: unknown };
    if (!isEnumValue(QuestCard, card)) return false;

    // Good-aligned players must play Success
    if (card === QuestCard.Fail && isGoodPlayer(game, callerId)) return false;

    return true;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== AvalonPhase.Quest) return;
    if (!payload || typeof payload !== "object") return;

    const { card } = payload as { card: QuestCard };
    ts.phase.cards = [...ts.phase.cards, { playerId: callerId, card }];
  },
};
