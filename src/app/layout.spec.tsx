import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-sans" }),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

import { BodyThemeOverride } from "./[gameMode]/body-theme-override";
import RootLayout from "./layout";

afterEach(cleanup);

describe("data-theme='shadowplay' on root layout", () => {
  it("applies data-theme='shadowplay' to document.body", () => {
    render(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );
    // React applies attributes on <body> to the actual document.body in happy-dom
    expect(document.body.getAttribute("data-theme")).toBe("shadowplay");
  });
});

describe("game and lobby screens are unaffected", () => {
  it("game-mode layout override applies and restores body theme for portals", () => {
    document.body.setAttribute("data-theme", "shadowplay");

    const { unmount } = render(<BodyThemeOverride theme="werewolf" />);

    expect(document.body.getAttribute("data-theme")).toBe("werewolf");

    unmount();

    expect(document.body.getAttribute("data-theme")).toBe("shadowplay");
  });
});
