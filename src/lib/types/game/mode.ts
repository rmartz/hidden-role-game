// --- Game Modes ---

export enum GameMode {
  Avalon = "avalon",
  Clocktower = "clocktower",
  Codenames = "codenames",
  SecretVillain = "secret-villain",
  Werewolf = "werewolf",
}

// --- Role Config Modes ---

export enum RoleConfigMode {
  Default = "Default",
  Custom = "Custom",
  Advanced = "Advanced",
}

// --- Show Roles In Play Options ---

export enum ShowRolesInPlay {
  None = "None",
  ConfiguredOnly = "ConfiguredOnly",
  AssignedRolesOnly = "AssignedRolesOnly",
  RoleAndCount = "RoleAndCount",
}
