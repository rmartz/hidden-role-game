import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

import { OwnerNightTargetPanel } from "./OwnerNightTargetPanel";

afterEach(cleanup);

const targetablePlayers = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Charlie" },
];

const baseProps = {
  groupAction: false,
  resolvedVotes: [],
  activeTargetConfirmed: false,
  targetablePlayers,
  onTargetClick: vi.fn(),
  isPending: false,
};

describe("OwnerNightTargetPanel — single-target mode", () => {
  it("renders player buttons and a Skip button", () => {
    render(<OwnerNightTargetPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: "Alice" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Bob" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Skip" })).toBeDefined();
  });

  it("calls onTargetClick with the player ID when clicking an unselected player", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel {...baseProps} onTargetClick={onTargetClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    expect(onTargetClick).toHaveBeenCalledWith("p1");
  });

  it("calls onTargetClick with undefined when clicking the already-selected player", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        activeTarget="p1"
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    expect(onTargetClick).toHaveBeenCalledWith(undefined);
  });

  it("calls onTargetClick with undefined when clicking Skip", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        activeTarget="p1"
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onTargetClick).toHaveBeenCalledWith(undefined);
  });
});

describe("OwnerNightTargetPanel — dual-target mode", () => {
  it("renders a No Target button instead of Skip", () => {
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorNoTargets}
      />,
    );
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
    expect(screen.getByRole("button", { name: "No Target" })).toBeDefined();
  });

  it("shows the dualTargetPrompt", () => {
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorNoTargets}
      />,
    );
    expect(
      screen.getByText(WEREWOLF_COPY.swapper.narratorNoTargets),
    ).toBeDefined();
  });

  it("sets first target when no target is selected", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorNoTargets}
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    expect(onTargetClick).toHaveBeenCalledWith("p1");
  });

  it("sets second target when first target is already selected", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        activeTarget="p1"
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorOneTarget}
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bob" }));
    expect(onTargetClick).toHaveBeenCalledWith("p2", true);
  });

  it("deselects first target when clicking it again", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        activeTarget="p1"
        secondTarget="p2"
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorTwoTargets(
          "Alice",
          "Bob",
        )}
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alice" }));
    expect(onTargetClick).toHaveBeenCalledWith(undefined);
  });

  it("deselects second target when clicking it again", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        activeTarget="p1"
        secondTarget="p2"
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorTwoTargets(
          "Alice",
          "Bob",
        )}
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Bob" }));
    expect(onTargetClick).toHaveBeenCalledWith(undefined, true);
  });

  it("disables unselected players when both targets are already set", () => {
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        activeTarget="p1"
        secondTarget="p2"
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorTwoTargets(
          "Alice",
          "Bob",
        )}
      />,
    );
    const charlieButton = screen.getByRole("button", { name: "Charlie" });
    expect(charlieButton.hasAttribute("disabled")).toBe(true);
  });

  it("sends null when No Target is clicked to clear all selections", () => {
    const onTargetClick = vi.fn();
    render(
      <OwnerNightTargetPanel
        {...baseProps}
        requiresDualTarget
        activeTarget="p1"
        secondTarget="p2"
        dualTargetPrompt={WEREWOLF_COPY.swapper.narratorTwoTargets(
          "Alice",
          "Bob",
        )}
        onTargetClick={onTargetClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "No Target" }));
    expect(onTargetClick).toHaveBeenCalledWith(null);
  });
});
