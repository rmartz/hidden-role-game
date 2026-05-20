"use client";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LobbyPageHeader } from "./LobbyPageHeader";
import { LOBBY_PAGE_COPY } from "./page.copy";

afterEach(cleanup);

describe("h1 shows dynamic lobby name when data is loaded", () => {
  it("renders the owner's player name in the h1", () => {
    const { container } = render(
      <LobbyPageHeader
        lobbyName="Marin"
        lobbyId="lobby-1"
        gameMode="werewolf"
      />,
    );
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toContain("Marin");
  });

  it("does not render the static fallback title when lobbyName is provided", () => {
    const { container } = render(
      <LobbyPageHeader
        lobbyName="Marin"
        lobbyId="lobby-1"
        gameMode="werewolf"
      />,
    );
    expect(container.textContent).not.toContain("Hidden Role Game");
  });
});

describe("h1 falls back while loading", () => {
  it("renders the fallback title when lobbyName is undefined", () => {
    const { container } = render(
      <LobbyPageHeader
        lobbyName={undefined}
        lobbyId="lobby-1"
        gameMode="werewolf"
      />,
    );
    const h1 = container.querySelector("h1");
    expect(h1?.textContent).toContain(LOBBY_PAGE_COPY.loadingTitle);
  });
});
