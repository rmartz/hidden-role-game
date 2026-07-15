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
  Advanced = "Advanced",
  Custom = "Custom",
  Default = "Default",
}

/**
 * Display order for the role-config-mode picker. Declared explicitly so the
 * `RoleConfigMode` members can be alphabetized (merge-conflict hygiene) without
 * changing the order the picker tabs render in.
 */
export const ROLE_CONFIG_MODE_ORDER = [
  RoleConfigMode.Default,
  RoleConfigMode.Custom,
  RoleConfigMode.Advanced,
] as const;

// --- Show Roles In Play Options ---

export enum ShowRolesInPlay {
  AssignedRolesOnly = "AssignedRolesOnly",
  ConfiguredOnly = "ConfiguredOnly",
  None = "None",
  RoleAndCount = "RoleAndCount",
}
