import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VETERAN_ALERTS_LIMIT } from "@/lib/game/modes/werewolf";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

import { VeteranActionPanelView } from "./VeteranActionPanelView";

afterEach(cleanup);

const defaultProps = {
  alertsUsed: 0,
  isAlerted: false,
  hasDecided: false,
  isConfirmed: false,
  isPending: false,
  onAlert: vi.fn(),
  onSkip: vi.fn(),
  onConfirm: vi.fn(),
};

describe("VeteranActionPanelView", () => {
  it("shows alerts remaining count", () => {
    render(<VeteranActionPanelView {...defaultProps} alertsUsed={1} />);
    const remaining = VETERAN_ALERTS_LIMIT - 1;
    expect(
      screen.getByText(WEREWOLF_COPY.veteran.alertsRemaining(remaining)),
    ).toBeDefined();
  });

  it("calls onAlert when Alert button is clicked", () => {
    const onAlert = vi.fn();
    render(<VeteranActionPanelView {...defaultProps} onAlert={onAlert} />);
    fireEvent.click(
      screen.getByRole("button", { name: WEREWOLF_COPY.veteran.alertButton }),
    );
    expect(onAlert).toHaveBeenCalledOnce();
  });

  it("calls onSkip when Stay Home button is clicked", () => {
    const onSkip = vi.fn();
    render(<VeteranActionPanelView {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(
      screen.getByRole("button", { name: WEREWOLF_COPY.veteran.skipButton }),
    );
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("disables Alert button when all alerts are used", () => {
    render(
      <VeteranActionPanelView
        {...defaultProps}
        alertsUsed={VETERAN_ALERTS_LIMIT}
      />,
    );
    const alertButton = screen.getByRole("button", {
      name: WEREWOLF_COPY.veteran.alertButton,
    });
    expect(alertButton).toHaveProperty("disabled", true);
  });

  it("shows confirmed message when isConfirmed is true", () => {
    render(
      <VeteranActionPanelView
        {...defaultProps}
        isConfirmed={true}
        isAlerted={true}
        hasDecided={true}
      />,
    );
    expect(
      screen.getByText(WEREWOLF_COPY.confirmButton.actionConfirmed),
    ).toBeDefined();
  });

  it("disables confirm button when no decision made", () => {
    render(<VeteranActionPanelView {...defaultProps} hasDecided={false} />);
    const confirmButton = screen.getByRole("button", {
      name: WEREWOLF_COPY.confirmButton.confirm,
    });
    expect(confirmButton).toHaveProperty("disabled", true);
  });
});
