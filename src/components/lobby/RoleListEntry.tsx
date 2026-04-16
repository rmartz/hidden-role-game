import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import { RoleConfigMode } from "@/lib/types";
import { RoleConfigEntry } from "./RoleConfigEntry";

export interface RoleListEntryProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  dimmed: boolean;
  readOnly: boolean;
  /** Only consumed in readOnly mode; ignored by the editable branch. */
  count?: number;
  disabled: boolean;
}

export function RoleListEntry({
  role,
  gameMode,
  roleConfigMode,
  dimmed,
  readOnly,
  count,
  disabled,
}: RoleListEntryProps) {
  return readOnly ? (
    <RoleConfigEntry
      role={role}
      gameMode={gameMode}
      roleConfigMode={roleConfigMode}
      count={count ?? 0}
      readOnly={true}
      dimmed={dimmed}
    />
  ) : (
    <RoleConfigEntry
      role={role}
      gameMode={gameMode}
      roleConfigMode={roleConfigMode}
      readOnly={false}
      disabled={disabled}
      dimmed={dimmed}
    />
  );
}
