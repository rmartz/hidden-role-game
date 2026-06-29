import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WerewolfRole } from "@/lib/game/modes/werewolf";

import { NightOutcomeSummaryItem } from "./NightOutcomeSummaryItem";
import { NIGHT_OUTCOME_SUMMARY_ITEM_COPY } from "./NightOutcomeSummaryItem.copy";

afterEach(cleanup);

const roles = {
  [WerewolfRole.Werewolf]: { name: "Werewolf" },
};

describe("NightOutcomeSummaryItem", () => {
  it("renders the player name", () => {
    render(
      <NightOutcomeSummaryItem playerName="Alice" events={[]} roles={roles} />,
    );
    expect(screen.getByText("Alice")).toBeDefined();
  });

  it("renders the hangover label when a hangover event is present", () => {
    render(
      <NightOutcomeSummaryItem
        playerName="Bob"
        events={[{ type: "hangover", targetPlayerId: "p2" }]}
        roles={roles}
      />,
    );
    expect(
      screen.getByText(NIGHT_OUTCOME_SUMMARY_ITEM_COPY.hangover),
    ).toBeDefined();
  });

  it("does not render the hangover label when no hangover event is present", () => {
    render(
      <NightOutcomeSummaryItem
        playerName="Charlie"
        events={[]}
        roles={roles}
      />,
    );
    expect(
      screen.queryByText(NIGHT_OUTCOME_SUMMARY_ITEM_COPY.hangover),
    ).toBeNull();
  });
});
