import type { Game, GameAction } from "@/lib/types";
import { GameStatus, Team } from "@/lib/types";
import { AvalonPhase, QuestCard } from "../types";
import type { AvalonTurnState } from "../types";
import { AVALON_ROLES } from "../roles";
import type { AvalonRole } from "../roles";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

function isGoodPlayer(game: Game, playerId: string): boolean {
  const assignment = game.roleAssignments.find((a) => a.playerId === playerId);
  if (!assignment) return false;
  const role = AVALON_ROLES[assignment.roleDefinitionId as AvalonRole];
  return role.team === Team.Good;
}

const VALID_CARDS: QuestCard[] = [QuestCard.Success, QuestCard.Fail];

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

    const { card } = payload as { card?: unknown };
    if (typeof card !== "string") return false;
    if (!VALID_CARDS.includes(card as QuestCard)) return false;

    // Good-aligned players must play Success; cast to QuestCard after inclusion check
    const typedCard = card as QuestCard;
    if (typedCard === QuestCard.Fail && isGoodPlayer(game, callerId))
      return false;

    return true;
  },

  apply(game: Game, payload: unknown, callerId: string) {
    const ts = currentTurnState(game);
    if (ts?.phase.type !== AvalonPhase.Quest) return;

    const { card } = payload as { card: QuestCard };
    ts.phase.cards = [...ts.phase.cards, { playerId: callerId, card }];
  },
};
