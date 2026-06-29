import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BodyThemeOverride } from "./body-theme-override";

afterEach(cleanup);

describe("BodyThemeOverride", () => {
  it("overrides document.body data-theme on mount and restores on unmount", () => {
    document.body.setAttribute("data-theme", "shadowplay");

    const { unmount } = render(<BodyThemeOverride theme="werewolf" />);

    expect(document.body.getAttribute("data-theme")).toBe("werewolf");

    unmount();

    expect(document.body.getAttribute("data-theme")).toBe("shadowplay");
  });

  it("updates document.body data-theme on rerender without reverting to previous value", () => {
    document.body.setAttribute("data-theme", "shadowplay");

    const { rerender } = render(<BodyThemeOverride theme="werewolf" />);

    expect(document.body.getAttribute("data-theme")).toBe("werewolf");

    rerender(<BodyThemeOverride theme="avalon" />);

    expect(document.body.getAttribute("data-theme")).toBe("avalon");
  });
});
