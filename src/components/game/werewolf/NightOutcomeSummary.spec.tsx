import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { WerewolfRole } from "@/lib/game/modes/werewolf";
import { NightOutcomeSummary } from "./NightOutcomeSummary";

afterEach(cleanup);

describe("NightOutcomeSummary", () => {
  const players = [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ];
  const roles = {
    [WerewolfRole.Werewolf]: { name: "Werewolf" },
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
});
