import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PlayerNightSummary } from "./PlayerNightSummary";
import type { DaytimeNightStatusEntry } from "@/server/types";
import type { PublicLobbyPlayer } from "@/server/types/lobby";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

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
});
