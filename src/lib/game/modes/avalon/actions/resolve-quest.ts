import type { Game, GameAction } from "@/lib/types";
import { GameStatus } from "@/lib/types";
import { AvalonPhase, QuestCard } from "../types";
import type { AvalonTurnState } from "../types";
import { AvalonRole } from "../roles";

function currentTurnState(game: Game): AvalonTurnState | undefined {
  if (game.status.type !== GameStatus.Playing) return undefined;
  return game.status.turnState as AvalonTurnState | undefined;
}

const QUEST_WIN_THRESHOLD = 3;

function findAssassinPlayerId(game: Game): string | undefined {
  const assassinId: string = AvalonRole.Assassin;
  const assignment = game.roleAssignments.find(
    (a) => a.roleDefinitionId === assassinId,
  );
  return assignment?.playerId;
}

/**
 * Count the number of Fail cards played and set failCount and succeeded on
 * the current Quest phase. Does NOT transition phase.
 */
export function tallyQuestCards(game: Game): void {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== AvalonPhase.Quest) return;
  if (ts.phase.failCount !== undefined) return;

  const failCount = ts.phase.cards.filter(
    (c) => c.card === QuestCard.Fail,
  ).length;

  const requiresTwoFails = ts.requiresTwoFails.includes(ts.questNumber);
  const failThreshold = requiresTwoFails ? 2 : 1;
  const succeeded = failCount < failThreshold;

  ts.phase.failCount = failCount;
  ts.phase.succeeded = succeeded;
}

/**
 * Advance from a resolved Quest phase to the next phase:
 * - Record the quest result.
 * - If 3 Good quests: start Assassination (if Assassin role exists) or Good wins.
 * - If 3 Evil quests: Evil wins.
 * - Otherwise: advance to next quest's TeamProposal with the next leader.
 */
export function advanceFromQuest(game: Game): void {
  const ts = currentTurnState(game);
  if (ts?.phase.type !== AvalonPhase.Quest) return;

  const questPhase = ts.phase;
  const { failCount, succeeded, teamPlayerIds } = questPhase;
  if (failCount === undefined || succeeded === undefined) return;

  // Record quest result
  ts.questResults = [
    ...ts.questResults,
    {
      questNumber: ts.questNumber,
      teamSize: teamPlayerIds.length,
      teamPlayerIds,
      failCount,
      succeeded,
    },
  ];

  const goodWins = ts.questResults.filter((r) => r.succeeded).length;
  const evilWins = ts.questResults.filter((r) => !r.succeeded).length;

  if (goodWins >= QUEST_WIN_THRESHOLD) {
    // Good won enough quests — check for Assassin
    const assassinPlayerId = findAssassinPlayerId(game);
    if (assassinPlayerId) {
      ts.phase = {
        type: AvalonPhase.Assassination,
        assassinPlayerId,
      };
    } else {
      game.status = {
        type: GameStatus.Finished,
        winner: "Good",
        victoryConditionKey: "quests",
      };
    }
    return;
  }

  if (evilWins >= QUEST_WIN_THRESHOLD) {
    game.status = {
      type: GameStatus.Finished,
      winner: "Bad",
      victoryConditionKey: "quests",
    };
    return;
  }

  // Advance to next quest — rotate leader, increment quest number
  ts.questNumber++;
  const nextLeaderIndex = (ts.currentLeaderIndex + 1) % ts.leaderOrder.length;
  ts.currentLeaderIndex = nextLeaderIndex;
  // leaderOrder is guaranteed non-empty (validated at game init)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const nextLeaderId = ts.leaderOrder[nextLeaderIndex]!;
  const teamSize = ts.questTeamSizes[ts.questNumber - 1] ?? 2;

  ts.phase = {
    type: AvalonPhase.TeamProposal,
    leaderId: nextLeaderId,
    teamSize,
  };
}

/**
 * Tally all played quest cards and mark the quest resolved.
 * Any player can trigger this once all team members have submitted cards.
 */
export const resolveQuestAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.Quest) return false;
    if (ts.phase.failCount !== undefined) return false;
    // All team members must have submitted
    return ts.phase.cards.length === ts.phase.teamPlayerIds.length;
  },

  apply(game: Game) {
    tallyQuestCards(game);
  },
};

/**
 * Advance from quest results to the next phase.
 * Any player can call this once the quest has been tallied.
 */
export const advanceFromQuestAction: GameAction = {
  isValid(game: Game) {
    const ts = currentTurnState(game);
    if (!ts) return false;
    if (ts.phase.type !== AvalonPhase.Quest) return false;
    return ts.phase.failCount !== undefined;
  },

  apply(game: Game) {
    advanceFromQuest(game);
  },
};
