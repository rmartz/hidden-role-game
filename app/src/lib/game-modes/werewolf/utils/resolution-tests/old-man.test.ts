import { describe, it, expect } from "vitest";
import { WerewolfRole } from "../../roles";
import { resolveNightActions, OLD_MAN_TIMER_KEY } from "../resolution";
import { findKilled } from "./helpers";

describe("resolveNightActions", () => {
  describe("Old Man", () => {
    const oldManAssignments = [
      { playerId: "w1", roleDefinitionId: WerewolfRole.Werewolf },
      { playerId: "bg1", roleDefinitionId: WerewolfRole.Bodyguard },
      { playerId: "om1", roleDefinitionId: WerewolfRole.OldMan },
      { playerId: "p1", roleDefinitionId: WerewolfRole.Villager },
    ];

    it("timer fires: Old Man dies peacefully when not attacked that night", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" } },
        oldManAssignments,
        [],
        undefined,
        { oldManTimerPlayerId: "om1" },
      );
      const killEvent = findKilled(events, "om1");
      expect(killEvent).toMatchObject({
        died: true,
        attackedBy: [OLD_MAN_TIMER_KEY],
        protectedBy: [],
      });
    });

    it("timer fires: wolf attack takes precedence over timer (normal kill)", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "om1" } },
        oldManAssignments,
        [],
        undefined,
        { oldManTimerPlayerId: "om1" },
      );
      const killEvent = findKilled(events, "om1");
      expect(killEvent).toMatchObject({ died: true });
      expect(killEvent?.attackedBy).toEqual([WerewolfRole.Werewolf]);
    });

    it("Old Man can be saved by Bodyguard when timer has not fired", () => {
      const events = resolveNightActions(
        {
          [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "om1" },
          [WerewolfRole.Bodyguard]: { targetPlayerId: "om1" },
        },
        oldManAssignments,
        [],
      );
      expect(findKilled(events, "om1")).toMatchObject({ died: false });
    });

    it("no timer: Old Man is not added to kill events", () => {
      const events = resolveNightActions(
        { [WerewolfRole.Werewolf]: { votes: [], suggestedTargetId: "p1" } },
        oldManAssignments,
        [],
      );
      expect(findKilled(events, "om1")).toBeUndefined();
    });
  });
});
