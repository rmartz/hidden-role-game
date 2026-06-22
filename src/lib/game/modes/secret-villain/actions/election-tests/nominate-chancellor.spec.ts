import { describe, expect, it } from "vitest";

import type { ElectionVotePhase } from "../../types";
import { SecretVillainPhase } from "../../types";
import { nominateChancellorAction } from "../nominate-chancellor";
import { getTurnState, makeElectionGame } from "./helpers";

describe("nominateChancellorAction", () => {
  describe("isValid", () => {
    it("president can nominate an eligible player", () => {
      const game = makeElectionGame();
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p2" }),
      ).toBe(true);
    });

    it("non-president cannot nominate", () => {
      const game = makeElectionGame();
      expect(
        nominateChancellorAction.isValid(game, "p2", { chancellorId: "p3" }),
      ).toBe(false);
    });

    it("cannot nominate self", () => {
      const game = makeElectionGame();
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p1" }),
      ).toBe(false);
    });

    it("cannot nominate eliminated player", () => {
      const game = makeElectionGame({
        turnState: { eliminatedPlayerIds: ["p3"] },
      });
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p3" }),
      ).toBe(false);
    });

    it("cannot nominate previous chancellor", () => {
      const game = makeElectionGame({
        turnState: { previousChancellorId: "p2" },
      });
      expect(
        nominateChancellorAction.isValid(game, "p1", { chancellorId: "p2" }),
      ).toBe(false);
    });
  });

  describe("apply", () => {
    it("transitions to ElectionVote phase with correct data", () => {
      const game = makeElectionGame();
      nominateChancellorAction.apply(game, { chancellorId: "p3" }, "p1");

      const ts = getTurnState(game);
      expect(ts.phase.type).toBe(SecretVillainPhase.ElectionVote);
      const phase = ts.phase as ElectionVotePhase;
      expect(phase.presidentId).toBe("p1");
      expect(phase.chancellorNomineeId).toBe("p3");
      expect(phase.votes).toEqual([]);
    });
  });
});
