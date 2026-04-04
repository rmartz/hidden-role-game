import { describe, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  act,
} from "@testing-library/react";
import { PlayerRoleDisplay } from "./PlayerRoleDisplay";
import type { PublicRoleInfo } from "@/server/types";
import { GameMode, Team } from "@/lib/types";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

afterEach(cleanup);

const mockRole: PublicRoleInfo = {
  id: "seer",
  name: "Seer",
  team: Team.Good,
};

describe("PlayerRoleDisplay", () => {
  it("renders the show role button by default", () => {
    render(<PlayerRoleDisplay role={mockRole} gameMode={GameMode.Werewolf} />);

    expect(screen.getByText(WEREWOLF_COPY.roleDisplay.showRole)).toBeDefined();
  });

  it("renders role name and team label when revealed", () => {
    render(<PlayerRoleDisplay role={mockRole} gameMode={GameMode.Werewolf} />);

    act(() => {
      fireEvent.click(screen.getByText(WEREWOLF_COPY.roleDisplay.showRole));
    });

    const expectedText = WEREWOLF_COPY.roleDisplay.roleRevealed(
      "Seer",
      "Villagers",
    );
    expect(screen.getByText(expectedText)).toBeDefined();
  });

  it("renders role name with raw team when no gameMode is provided", () => {
    render(<PlayerRoleDisplay role={mockRole} />);

    act(() => {
      fireEvent.click(screen.getByText(WEREWOLF_COPY.roleDisplay.showRole));
    });

    const expectedText = WEREWOLF_COPY.roleDisplay.roleRevealed("Seer", "Good");
    expect(screen.getByText(expectedText)).toBeDefined();
  });
});
