import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NightActionMarker, NightMarkerEffect } from "./NightActionMarker";
import { NIGHT_ACTION_MARKER_COPY } from "./NightActionMarker.copy";

afterEach(cleanup);

describe("NightActionMarker", () => {
  it("renders the Attacked label", () => {
    render(<NightActionMarker effect={NightMarkerEffect.Attacked} />);
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.attacked)).toBeDefined();
  });

  it("renders the Protected label", () => {
    render(<NightActionMarker effect={NightMarkerEffect.Protected} />);
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.protected)).toBeDefined();
  });

  it("renders the Silenced label", () => {
    render(<NightActionMarker effect={NightMarkerEffect.Silenced} />);
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.silenced)).toBeDefined();
  });

  it("renders the Hypnotized label", () => {
    render(<NightActionMarker effect={NightMarkerEffect.Hypnotized} />);
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.hypnotized)).toBeDefined();
  });

  it("renders the Investigated label", () => {
    render(<NightActionMarker effect={NightMarkerEffect.Investigated} />);
    expect(
      screen.getByText(NIGHT_ACTION_MARKER_COPY.investigated),
    ).toBeDefined();
  });

  it("renders the Special label", () => {
    render(<NightActionMarker effect={NightMarkerEffect.Special} />);
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.special)).toBeDefined();
  });
});
