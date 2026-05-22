import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LobbyPageHeaderView } from "./LobbyPageHeaderView";

afterEach(cleanup);

describe("LobbyPageHeaderView", () => {
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
