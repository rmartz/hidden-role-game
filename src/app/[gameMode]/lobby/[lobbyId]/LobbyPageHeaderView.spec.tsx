import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LobbyPageHeaderView } from "./LobbyPageHeaderView";
import { LOBBY_PAGE_COPY } from "./page.copy";

afterEach(cleanup);

describe("renders provided title strings", () => {
  it("renders the provided title string in the h1", () => {
    const { container } = render(
      <LobbyPageHeaderView
        title="Marin"
        lobbyId="lobby-1"
        gameMode="werewolf"
      />,
    );
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toBe("Marin");
  });
});

describe("renders loading title when provided", () => {
  it("renders the loading title string in the h1", () => {
    const { container } = render(
      <LobbyPageHeaderView
        title={LOBBY_PAGE_COPY.loadingTitle}
        lobbyId="lobby-1"
        gameMode="werewolf"
      />,
    );
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toContain(LOBBY_PAGE_COPY.loadingTitle);
  });
});
