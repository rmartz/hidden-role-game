import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";


import { Team } from "@/lib/types";
import type { VisibleTeammate } from "@/server/types";
import { NarratorPlayerRoleLists } from "./NarratorPlayerRoleLists";
import { NightMarkerEffect } from "./NightActionMarker";
import { NIGHT_ACTION_MARKER_COPY } from "./NightActionMarker.copy";
import { NARRATOR_PLAYER_ROLE_LISTS_COPY } from "./NarratorPlayerRoleLists.copy";

afterEach(cleanup);

const assignments: VisibleTeammate[] = [
  {
    player: { id: "p1", name: "Alice" },
    reason: "revealed",
    role: { id: "werewolf-seer", name: "Seer", team: Team.Good },
  },
  {
    player: { id: "p2", name: "Bob" },
    reason: "revealed",
    role: { id: "werewolf-doctor", name: "Doctor", team: Team.Good },
  },
  {
    player: { id: "p3", name: "Charlie" },
    reason: "revealed",
    role: { id: "werewolf-villager", name: "Villager", team: Team.Good },
  },
];

describe("NarratorPlayerRoleLists", () => {
  it("shows no markers when nightStatusMarkers is not provided", () => {
    render(<NarratorPlayerRoleLists assignments={assignments} />);
    expect(screen.queryByText(NIGHT_ACTION_MARKER_COPY.attacked)).toBeNull();
  });

  it("shows an Attacked marker next to the targeted player", () => {
    render(
      <NarratorPlayerRoleLists
        assignments={assignments}
        nightStatusMarkers={new Map([["p1", [NightMarkerEffect.Attacked]]])}
      />,
    );
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.attacked)).toBeDefined();
  });

  it("shows a Protected marker next to the targeted player", () => {
    render(
      <NarratorPlayerRoleLists
        assignments={assignments}
        nightStatusMarkers={new Map([["p2", [NightMarkerEffect.Protected]]])}
      />,
    );
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.protected)).toBeDefined();
  });

  it("shows multiple markers for a player targeted by multiple roles", () => {
    render(
      <NarratorPlayerRoleLists
        assignments={assignments}
        nightStatusMarkers={
          new Map([
            ["p1", [NightMarkerEffect.Attacked, NightMarkerEffect.Protected]],
          ])
        }
      />,
    );
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.attacked)).toBeDefined();
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.protected)).toBeDefined();
  });

  it("shows markers for multiple players", () => {
    render(
      <NarratorPlayerRoleLists
        assignments={assignments}
        nightStatusMarkers={
          new Map([
            ["p1", [NightMarkerEffect.Investigated]],
            ["p2", [NightMarkerEffect.Silenced]],
          ])
        }
      />,
    );
    expect(
      screen.getByText(NIGHT_ACTION_MARKER_COPY.investigated),
    ).toBeDefined();
    expect(screen.getByText(NIGHT_ACTION_MARKER_COPY.silenced)).toBeDefined();
  });

  it("shows player names in the list", () => {
    render(<NarratorPlayerRoleLists assignments={assignments} />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
  });

  it("shows eliminated section when some players are dead", () => {
    render(
      <NarratorPlayerRoleLists
        assignments={assignments}
        deadPlayerIds={["p3"]}
      />,
    );
    expect(
      screen.getByText(NARRATOR_PLAYER_ROLE_LISTS_COPY.eliminated),
    ).toBeDefined();
  });

  it("does not show night markers for eliminated players", () => {
    render(
      <NarratorPlayerRoleLists
        assignments={assignments}
        deadPlayerIds={["p1"]}
        nightStatusMarkers={new Map([["p1", [NightMarkerEffect.Attacked]]])}
      />,
    );
    // Alice is dead — her marker should not appear in the active section.
    // The eliminated section does not render markers.
    expect(screen.queryByText(NIGHT_ACTION_MARKER_COPY.attacked)).toBeNull();
  });
});
