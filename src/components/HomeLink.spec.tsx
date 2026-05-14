import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect } from "vitest";
import { HomeLink } from "./HomeLink";
import { HOME_LINK_COPY } from "./HomeLink.copy";

afterEach(cleanup);

describe("HomeLink", () => {
  it("renders a link to the home page", () => {
    const { getByRole } = render(<HomeLink />);
    const link = getByRole("link");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/");
  });

  it("displays the home label", () => {
    const { getByRole } = render(<HomeLink />);
    const link = getByRole("link");
    expect(link.textContent).toContain(HOME_LINK_COPY.label);
  });
});
