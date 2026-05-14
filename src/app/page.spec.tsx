import { afterEach, describe, it, expect, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GameMode } from "@/lib/types";
import { HomePageView } from "./HomePageView";
import { HOME_PAGE_COPY } from "./page.copy";

afterEach(cleanup);

const noop = vi.fn();

const defaultProps = {
  playerName: "",
  lobbyIdInput: "",
  selectedGameMode: GameMode.Werewolf,
  gameModeOptions: [{ value: GameMode.Werewolf, label: "Werewolf" }],
  activeLobby: undefined,
  storedLobbyId: undefined,
  error: undefined,
  loading: false,
  isCreatePending: false,
  isJoinPending: false,
  onPlayerNameChange: noop,
  onLobbyIdChange: noop,
  onGameModeChange: noop,
  onCreateLobby: noop,
  onJoinLobby: noop,
  onRejoinGame: noop,
  onRejoinLobby: noop,
};

describe("Active lobby banner", () => {
  it("shows rejoin game button when active lobby has a gameId", () => {
    const { container } = render(
      <HomePageView
        {...defaultProps}
        activeLobby={{ gameId: "g1" }}
        storedLobbyId="lobby-1"
      />,
    );
    expect(container.textContent).toContain(HOME_PAGE_COPY.rejoinGame);
  });

  it("shows rejoin lobby button when active lobby has no gameId", () => {
    const { container } = render(
      <HomePageView
        {...defaultProps}
        activeLobby={{ gameId: undefined }}
        storedLobbyId="lobby-1"
      />,
    );
    expect(container.textContent).toContain(HOME_PAGE_COPY.rejoinLobby);
  });

  it("does not show active lobby banner when activeLobby is undefined", () => {
    const { container } = render(
      <HomePageView {...defaultProps} activeLobby={undefined} />,
    );
    expect(container.textContent).not.toContain(HOME_PAGE_COPY.rejoinGame);
    expect(container.textContent).not.toContain(HOME_PAGE_COPY.rejoinLobby);
  });
});

describe("Divider with 'or start fresh' label", () => {
  it("shows the 'or start fresh' divider when active lobby is present", () => {
    const { container } = render(
      <HomePageView
        {...defaultProps}
        activeLobby={{ gameId: "g1" }}
        storedLobbyId="lobby-1"
      />,
    );
    expect(container.textContent).toContain(HOME_PAGE_COPY.orStartFresh);
  });

  it("does not show the 'or start fresh' divider when no active lobby", () => {
    const { container } = render(
      <HomePageView {...defaultProps} activeLobby={undefined} />,
    );
    expect(container.textContent).not.toContain(HOME_PAGE_COPY.orStartFresh);
  });
});

describe("Player name field layout", () => {
  it("renders the player name label", () => {
    const { container } = render(<HomePageView {...defaultProps} />);
    expect(container.textContent).toContain(HOME_PAGE_COPY.playerNameLabel);
  });

  it("renders with the player name value from props", () => {
    const { container } = render(
      <HomePageView {...defaultProps} playerName="Alice" />,
    );
    const input = container.querySelector<HTMLInputElement>("#player-name");
    expect(input?.value).toBe("Alice");
  });
});

describe("Create and Join cards layout", () => {
  it("renders the create lobby button", () => {
    const { container } = render(<HomePageView {...defaultProps} />);
    expect(container.textContent).toContain(HOME_PAGE_COPY.createLobby);
  });

  it("renders the join lobby button", () => {
    const { container } = render(<HomePageView {...defaultProps} />);
    expect(container.textContent).toContain(HOME_PAGE_COPY.joinLobby);
  });

  it("shows creating text when create is pending", () => {
    const { container } = render(
      <HomePageView {...defaultProps} isCreatePending={true} />,
    );
    expect(container.textContent).toContain(HOME_PAGE_COPY.creating);
  });

  it("shows joining text when join is pending", () => {
    const { container } = render(
      <HomePageView {...defaultProps} isJoinPending={true} />,
    );
    expect(container.textContent).toContain(HOME_PAGE_COPY.joining);
  });
});

describe("Copy file completeness", () => {
  it("has orStartFresh copy key", () => {
    expect(HOME_PAGE_COPY.orStartFresh).toBeDefined();
  });
});
