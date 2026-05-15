import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WerewolfRole } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

import { NightOutcomeSummary } from "./NightOutcomeSummary";

afterEach(cleanup);

describe("NightOutcomeSummary", () => {
  const players = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Carol" },
  ];
  const roles = {
    [WerewolfRole.Werewolf]: { name: "Werewolf" },
    [WerewolfRole.Veteran]: { name: "Veteran" },
  };

  it("renders a single row when the knighted player also has night events", () => {
    render(
      <NightOutcomeSummary
        events={[
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: [WerewolfRole.Werewolf],
            protectedBy: [],
            died: false,
          },
          {
            type: "silenced",
            targetPlayerId: "p2",
          },
        ]}
        players={players}
        roles={roles}
        knightedPlayerId="p2"
      />,
    );

    expect(screen.getAllByText("Bob")).toHaveLength(1);
    expect(screen.getByText("(knighted)")).toBeDefined();
    expect(screen.getByText("(silenced)")).toBeDefined();
    expect(screen.getByText("(survived)")).toBeDefined();
  });

  it("shows the Veteran announcement and suppresses the generic killed row when Veteran is the sole attacker", () => {
    render(
      <NightOutcomeSummary
        events={[
          {
            type: "veteran-counterkilled",
            counterkilledPlayerId: "p2",
            veteranPlayerId: "p1",
            source: "visitor",
            died: true,
          },
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: [WerewolfRole.Veteran],
            protectedBy: [],
            died: true,
          },
        ]}
        players={players}
        roles={roles}
      />,
    );

    const expectedMessage = WEREWOLF_COPY.veteran.dayAnnouncementVisitorKilled(
      "Alice",
      "Bob",
    );
    expect(screen.getByText(expectedMessage)).toBeDefined();
    // Generic "killed" row for Bob should be suppressed since Veteran is the sole attacker.
    expect(screen.queryByText("(killed)")).toBeNull();
  });

  it("retains the generic row for a Veteran-killed player who also has other events", () => {
    render(
      <NightOutcomeSummary
        events={[
          {
            type: "veteran-counterkilled",
            counterkilledPlayerId: "p2",
            veteranPlayerId: "p1",
            source: "visitor",
            died: true,
          },
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: [WerewolfRole.Veteran],
            protectedBy: [],
            died: true,
          },
          {
            type: "silenced",
            targetPlayerId: "p2",
          },
        ]}
        players={players}
        roles={roles}
      />,
    );

    // Veteran announcement should appear.
    const expectedMessage = WEREWOLF_COPY.veteran.dayAnnouncementVisitorKilled(
      "Alice",
      "Bob",
    );
    expect(screen.getByText(expectedMessage)).toBeDefined();
    // Bob's row should still appear with the silenced detail (killed event stripped, not the whole row).
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("(silenced)")).toBeDefined();
    // The generic killed label should not appear since that event is stripped.
    expect(screen.queryByText("(killed)")).toBeNull();
  });

  it("retains the generic killed row when the player was also attacked by another source alongside the Veteran", () => {
    render(
      <NightOutcomeSummary
        events={[
          {
            type: "veteran-counterkilled",
            counterkilledPlayerId: "p2",
            veteranPlayerId: "p1",
            source: "visitor",
            died: true,
          },
          {
            type: "killed",
            targetPlayerId: "p2",
            attackedBy: [WerewolfRole.Veteran, WerewolfRole.Werewolf],
            protectedBy: [],
            died: true,
          },
        ]}
        players={players}
        roles={roles}
      />,
    );

    // Veteran announcement should appear.
    const expectedMessage = WEREWOLF_COPY.veteran.dayAnnouncementVisitorKilled(
      "Alice",
      "Bob",
    );
    expect(screen.getByText(expectedMessage)).toBeDefined();
    // Generic killed row should be retained because there is a second attacker.
    expect(screen.getByText("(killed)")).toBeDefined();
  });
});
