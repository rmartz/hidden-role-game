import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GameMode, GameStatus } from "@/lib/types";
import { DEFAULT_SECRET_VILLAIN_TIMER_CONFIG } from "@/lib/game/modes/secret-villain/timer-config";
import {
  SecretVillainPhase,
  SpecialActionType,
} from "@/lib/game/modes/secret-villain/types";
import type { SecretVillainPlayerGameState } from "@/lib/game/modes/secret-villain/player-state";
import { BoardScreen } from "./BoardScreen";

const MEDIUM_POWER_TABLE = [
  undefined,
  undefined,
  SpecialActionType.InvestigateTeam,
  SpecialActionType.Shoot,
  SpecialActionType.Shoot,
];

const players = [
  { id: "p1", name: "Alice" },
  { id: "p2", name: "Bob" },
  { id: "p3", name: "Carol" },
  { id: "p4", name: "Dave" },
  { id: "p5", name: "Eve" },
];

const baseGameState: SecretVillainPlayerGameState = {
  gameMode: GameMode.SecretVillain,
  status: { type: GameStatus.Playing },
  lobbyId: "lobby-1",
  players,
  gameOwner: { id: "board-player", name: "Board" },
  myPlayerId: undefined,
  myRole: undefined,
  visibleRoleAssignments: [],
  timerConfig: DEFAULT_SECRET_VILLAIN_TIMER_CONFIG,
  svBoard: {
    goodCardsPlayed: 2,
    badCardsPlayed: 1,
    failedElectionCount: 0,
    powerTable: MEDIUM_POWER_TABLE,
  },
  deadPlayerIds: [],
};

const meta = {
  component: BoardScreen,
} satisfies Meta<typeof BoardScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NominationPhase: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svPhase: {
        type: SecretVillainPhase.ElectionNomination,
        presidentId: "p1",
      },
    },
  },
};

export const VotePhase: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svPhase: {
        type: SecretVillainPhase.ElectionVote,
        presidentId: "p1",
        chancellorNomineeId: "p2",
      },
    },
  },
};

export const PolicyPhase: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svPhase: {
        type: SecretVillainPhase.PolicyPresident,
        presidentId: "p1",
        chancellorId: "p3",
      },
      svBoard: {
        goodCardsPlayed: 3,
        badCardsPlayed: 2,
        failedElectionCount: 1,
        powerTable: MEDIUM_POWER_TABLE,
      },
    },
  },
};

export const WithEliminatedPlayers: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svPhase: {
        type: SecretVillainPhase.ElectionNomination,
        presidentId: "p1",
      },
      svBoard: {
        goodCardsPlayed: 2,
        badCardsPlayed: 3,
        failedElectionCount: 0,
        powerTable: MEDIUM_POWER_TABLE,
      },
      deadPlayerIds: ["p4", "p5"],
    },
  },
};

export const HighFailedElections: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svPhase: {
        type: SecretVillainPhase.ElectionNomination,
        presidentId: "p2",
      },
      svBoard: {
        goodCardsPlayed: 1,
        badCardsPlayed: 2,
        failedElectionCount: 2,
        powerTable: MEDIUM_POWER_TABLE,
      },
    },
  },
};

export const SpecialActionPhase: Story = {
  args: {
    gameState: {
      ...baseGameState,
      svPhase: {
        type: SecretVillainPhase.SpecialAction,
        presidentId: "p1",
        actionType: SpecialActionType.Shoot,
      },
      svBoard: {
        goodCardsPlayed: 1,
        badCardsPlayed: 4,
        failedElectionCount: 0,
        powerTable: MEDIUM_POWER_TABLE,
      },
    },
  },
};
