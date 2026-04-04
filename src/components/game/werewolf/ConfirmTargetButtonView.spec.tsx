import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ConfirmTargetButtonView } from "./ConfirmTargetButtonView";
import { WEREWOLF_COPY } from "@/lib/game-modes/werewolf/copy";

afterEach(cleanup);

const defaultProps = {
  hasTarget: false,
  hasDecided: false,
  isConfirmed: false,
  onConfirm: vi.fn(),
};

describe("ConfirmTargetButtonView", () => {
  it("shows 'Action confirmed!' text when isConfirmed is true", () => {
    render(<ConfirmTargetButtonView {...defaultProps} isConfirmed={true} />);
    expect(
      screen.getByText(WEREWOLF_COPY.confirmButton.actionConfirmed),
    ).toBeDefined();
  });

  it("shows 'Skip' label when hasDecided is true but hasTarget is false", () => {
    render(
      <ConfirmTargetButtonView
        {...defaultProps}
        hasDecided={true}
        hasTarget={false}
      />,
    );
    expect(
      screen.getByRole("button", {
        name: WEREWOLF_COPY.confirmButton.skip,
      }),
    ).toBeDefined();
  });

  it("button is disabled when hasDecided is false", () => {
    render(<ConfirmTargetButtonView {...defaultProps} hasDecided={false} />);
    const button = screen.getByRole("button", {
      name: WEREWOLF_COPY.confirmButton.confirm,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("button is disabled when isPending is true", () => {
    render(
      <ConfirmTargetButtonView
        {...defaultProps}
        hasDecided={true}
        isPending={true}
      />,
    );
    const button = screen.getByRole("button", {
      name: WEREWOLF_COPY.confirmButton.skip,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("button is disabled when group needs consensus", () => {
    render(
      <ConfirmTargetButtonView
        {...defaultProps}
        hasDecided={true}
        hasTarget={true}
        isGroupPhase={true}
        hasGroupMembers={true}
        allAgreed={false}
      />,
    );
    const button = screen.getByRole("button", {
      name: WEREWOLF_COPY.confirmButton.confirm,
    });
    expect(button.hasAttribute("disabled")).toBe(true);
  });
});
