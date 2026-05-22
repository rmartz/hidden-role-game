import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LobbyPageHeaderView } from "./LobbyPageHeaderView";
import { LOBBY_PAGE_COPY } from "./page.copy";

afterEach(cleanup);

describe("h1 shows dynamic lobby name when data is loaded", () => {
  it("renders the owner's player name in the h1", () => {
    const { container } = render(
      <LobbyPageHeaderView
        title="Marin"
        lobbyId="lobby-1"
        gameMode="werewolf"
      />,
    );
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toBe("Marin");
    expect(h1?.textContent).not.toContain(LOBBY_PAGE_COPY.loadingTitle);
  });
});

describe("h1 falls back while loading", () => {
  it("renders the fallback title while loading", () => {
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
