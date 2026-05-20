import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-sans" }),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

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
  it("root layout does not set a game-mode-specific theme", () => {
    render(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );
    const dataTheme = document.body.getAttribute("data-theme");
    expect(dataTheme).not.toBe("werewolf");
    expect(dataTheme).not.toBe("avalon");
    expect(dataTheme).not.toBe("secret_villain");
    expect(dataTheme).not.toBe("twilight_modern");
  });
});
