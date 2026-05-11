import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LobbyLayout } from "./LobbyLayout";

afterEach(cleanup);

describe("criterion 1: responsive layout classes prevent horizontal overflow", () => {
  it("applies max-w-screen-md for mobile column constraint", () => {
    render(<LobbyLayout>content</LobbyLayout>);
    const container = screen.getByTestId("lobby-layout");
    expect(container.className).toContain("max-w-screen-md");
  });

  it("applies md:max-w-6xl for landscape grid constraint", () => {
    render(<LobbyLayout>content</LobbyLayout>);
    const container = screen.getByTestId("lobby-layout");
    expect(container.className).toContain("md:max-w-6xl");
  });

  it("centers the layout with mx-auto", () => {
    render(<LobbyLayout>content</LobbyLayout>);
    const container = screen.getByTestId("lobby-layout");
    expect(container.className).toContain("mx-auto");
  });

  it("renders children inside the layout container", () => {
    render(<LobbyLayout>lobby content</LobbyLayout>);
    expect(screen.getByText("lobby content")).toBeDefined();
  });
});

describe("criterion 2: no window.innerWidth reads — branching is CSS-only", () => {
  it("does not read window.innerWidth during render", () => {
    let innerWidthRead = false;
    const originalDescriptor = Object.getOwnPropertyDescriptor(
      window,
      "innerWidth",
    );
    Object.defineProperty(window, "innerWidth", {
      get() {
        innerWidthRead = true;
        return 375;
      },
      configurable: true,
    });

    try {
      render(<LobbyLayout>content</LobbyLayout>);
      expect(innerWidthRead).toBe(false);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(window, "innerWidth", originalDescriptor);
      } else {
        delete (window as { innerWidth?: number }).innerWidth;
      }
    }
  });

  it("uses Tailwind breakpoint classes rather than inline style width", () => {
    render(<LobbyLayout>content</LobbyLayout>);
    const container = screen.getByTestId("lobby-layout");
    // The container must not set an inline width that would indicate JS-driven sizing
    expect(container.style.width).toBe("");
    expect(container.style.maxWidth).toBe("");
  });
});
