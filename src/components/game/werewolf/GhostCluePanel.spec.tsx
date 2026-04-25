import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GhostCluePanelView } from "./GhostCluePanel";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

afterEach(cleanup);

const defaultProps = {
  ghostClues: [],
  alreadySubmittedThisTurn: false,
  clue: "",
  onClueChange: vi.fn(),
  onSubmit: vi.fn(),
  isPending: false,
};

describe("GhostCluePanelView", () => {
  it("renders the input when not yet submitted", () => {
    render(<GhostCluePanelView {...defaultProps} />);

    const input = screen.getByRole("textbox", {
      name: WEREWOLF_COPY.ghost.clueInputLabel,
    });
    expect(input).toBeDefined();
    expect(
      screen.getByRole("button", { name: WEREWOLF_COPY.ghost.clueSubmitButton }),
    ).toBeDefined();
  });

  it("renders the already-submitted message when alreadySubmittedThisTurn is true", () => {
    render(
      <GhostCluePanelView {...defaultProps} alreadySubmittedThisTurn={true} />,
    );

    expect(
      screen.getByText(WEREWOLF_COPY.ghost.clueAlreadySubmitted),
    ).toBeDefined();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("renders prior clues when provided", () => {
    const ghostClues = [
      { turn: 1, clue: "wolf" },
      { turn: 2, clue: "north" },
    ];
    render(<GhostCluePanelView {...defaultProps} ghostClues={ghostClues} />);

    expect(
      screen.getByText(WEREWOLF_COPY.ghost.clueTurn(1, "wolf")),
    ).toBeDefined();
    expect(
      screen.getByText(WEREWOLF_COPY.ghost.clueTurn(2, "north")),
    ).toBeDefined();
  });

  it("calls onClueChange when the input value changes", () => {
    const onClueChange = vi.fn();
    render(
      <GhostCluePanelView {...defaultProps} onClueChange={onClueChange} />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: WEREWOLF_COPY.ghost.clueInputLabel }),
      { target: { value: "moon" } },
    );

    expect(onClueChange).toHaveBeenCalledWith("moon");
  });

  it("submit button is disabled when clue is empty", () => {
    render(<GhostCluePanelView {...defaultProps} clue="" />);

    const button = screen.getByRole("button", {
      name: WEREWOLF_COPY.ghost.clueSubmitButton,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("submit button is disabled when isPending is true", () => {
    render(
      <GhostCluePanelView {...defaultProps} clue="moon" isPending={true} />,
    );

    const button = screen.getByRole("button", {
      name: WEREWOLF_COPY.ghost.clueSubmitButton,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("calls onSubmit when submit button is clicked", () => {
    const onSubmit = vi.fn();
    render(
      <GhostCluePanelView {...defaultProps} clue="moon" onSubmit={onSubmit} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: WEREWOLF_COPY.ghost.clueSubmitButton }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
