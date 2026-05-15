import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

import { VetoPromptView } from "./VetoPromptView";

afterEach(cleanup);

const defaultProps = {
  onAccept: vi.fn(),
  onReject: vi.fn(),
};

describe("VetoPromptView", () => {
  it("shows accept and reject buttons", () => {
    render(<VetoPromptView {...defaultProps} />);
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.policy.acceptVeto,
      }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: SECRET_VILLAIN_COPY.policy.rejectVeto,
      }),
    ).toBeDefined();
  });

  it("buttons are disabled when pending", () => {
    render(<VetoPromptView {...defaultProps} isPending={true} />);
    const acceptButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.policy.acceptVeto,
    });
    const rejectButton = screen.getByRole("button", {
      name: SECRET_VILLAIN_COPY.policy.rejectVeto,
    });
    expect(acceptButton.hasAttribute("disabled")).toBe(true);
    expect(rejectButton.hasAttribute("disabled")).toBe(true);
  });

  it("shows veto prompt text", () => {
    render(<VetoPromptView {...defaultProps} />);
    expect(
      screen.getByText(SECRET_VILLAIN_COPY.policy.presidentVetoPrompt),
    ).toBeDefined();
  });
});
