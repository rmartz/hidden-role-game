import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";
import { VeteranCounterkillSource } from "@/lib/game/modes/werewolf/types";
import type { DaytimeNightStatusEntry } from "@/server/types";
import type { PublicLobbyPlayer } from "@/server/types/lobby";

import { PlayerNightSummary } from "./PlayerNightSummary";

afterEach(cleanup);

const players: PublicLobbyPlayer[] = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

describe("PlayerNightSummary", () => {
  it("renders killed player text", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      { targetPlayerId: "p1", effect: "killed" },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    expect(screen.getByText("Last Night")).toBeDefined();
    expect(screen.getByText("Alice was eliminated.")).toBeDefined();
  });

  it("renders protected player text", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      { targetPlayerId: "p2", effect: "protected" },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    const expectedText = WEREWOLF_COPY.day.protected("Bob");
    expect(screen.getByText(expectedText)).toBeDefined();
  });

  it("renders knighted player text", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      { targetPlayerId: "p2", effect: "knighted" },
    ];
    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);
    expect(screen.getByText("Bob was knighted.")).toBeDefined();
  });

  it("renders nothing when nightStatus is empty", () => {
    const { container } = render(
      <PlayerNightSummary players={players} nightStatus={[]} />,
    );

    expect(container.querySelector("h2")).toBeNull();
  });

  it("renders nothing when nightStatus is undefined", () => {
    const { container } = render(<PlayerNightSummary players={players} />);

    expect(container.querySelector("h2")).toBeNull();
  });

  it("renders exposed player text", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      { targetPlayerId: "p1", effect: "exposed", roleName: "Werewolf" },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    expect(
      screen.getByText(WEREWOLF_COPY.exposer.nightSummary("Alice", "Werewolf")),
    ).toBeDefined();
  });

  it("renders exposed message alongside kill when both apply to the same player", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      { targetPlayerId: "p1", effect: "killed" },
      { targetPlayerId: "p1", effect: "exposed", roleName: "Altruist" },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    expect(screen.getByText("Alice was eliminated.")).toBeDefined();
    expect(
      screen.getByText(WEREWOLF_COPY.exposer.nightSummary("Alice", "Altruist")),
    ).toBeDefined();
  });

  it("renders multiple effects", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      { targetPlayerId: "p1", effect: "killed" },
      { targetPlayerId: "p2", effect: "protected" },
      { targetPlayerId: "p3", effect: "peaceful" },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    expect(screen.getByText("Alice was eliminated.")).toBeDefined();
    expect(screen.getByText(WEREWOLF_COPY.day.protected("Bob"))).toBeDefined();
    expect(
      screen.getByText(WEREWOLF_COPY.oldMan.peacefulDeath("Charlie")),
    ).toBeDefined();
  });

  it("renders veteran-counterkill wolf-repel text", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      {
        targetPlayerId: "p1",
        effect: "veteran-counterkill",
        veteranPlayerId: "p2",
        veteranCounterkillSource: VeteranCounterkillSource.WolfRepel,
      },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    const expectedText = WEREWOLF_COPY.veteran.dayAnnouncementWolfRepel(
      "Bob",
      "Alice",
    );
    expect(screen.getByText(expectedText)).toBeDefined();
  });

  it("renders veteran-counterkill visitor text", () => {
    const nightStatus: DaytimeNightStatusEntry[] = [
      {
        targetPlayerId: "p1",
        effect: "veteran-counterkill",
        veteranPlayerId: "p3",
        veteranCounterkillSource: VeteranCounterkillSource.Visitor,
      },
    ];

    render(<PlayerNightSummary players={players} nightStatus={nightStatus} />);

    const expectedText = WEREWOLF_COPY.veteran.dayAnnouncementVisitorKilled(
      "Charlie",
      "Alice",
    );
    expect(screen.getByText(expectedText)).toBeDefined();
  });
});
