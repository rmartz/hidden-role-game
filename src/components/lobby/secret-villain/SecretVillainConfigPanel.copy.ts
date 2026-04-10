export const SECRET_VILLAIN_CONFIG_PANEL_COPY = {
  themeLabel: "Theme",
  boardPresetLabel: "Board Preset",
  customBoardHeading: "Custom Board Powers",
  badCardSlotLabel: (n: number) => `Bad Card #${String(n)}`,
  badCardSlotLocked: "locked",
  powerNone: "None",
  powerInvestigateTeam: "Investigate Team",
  powerPolicyPeek: "Policy Peek",
  powerSpecialElection: "Special Election",
  includeBoardLabel: "Include Board player",
  includeBoardDescription:
    "Adds a shared-display observer who sees the game board but no role assignments.",
} as const;
