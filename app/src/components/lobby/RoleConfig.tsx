import { sum } from "lodash";
import type { GameMode, RoleDefinition, Team } from "@/lib/models";
import { RoleConfigMode } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { useAppSelector } from "@/store";
import { RoleConfigEntry } from "./RoleConfigEntry";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  roleConfigMode: RoleConfigMode;
  playerCount: number;
  gameMode: GameMode;
  readOnly: true;
}

interface EditableProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  playerCount: number;
  roleConfigMode: RoleConfigMode;
  gameMode: GameMode;
  readOnly: false;
  disabled: boolean;
}

type Props = ReadOnlyProps | EditableProps;

export function RoleConfig(props: Props) {
  const { roleDefinitions, playerCount, gameMode, roleConfigMode, readOnly } =
    props;

  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);
  const roleMins = useAppSelector((s) => s.gameConfig.roleMins);
  const roleMaxes = useAppSelector((s) => s.gameConfig.roleMaxes);

  const isAdvanced = roleConfigMode === RoleConfigMode.Advanced;

  const readOnlyMin = readOnly
    ? Object.fromEntries((props.roleSlots ?? []).map((s) => [s.roleId, s.min]))
    : {};
  const readOnlyMax = readOnly
    ? Object.fromEntries((props.roleSlots ?? []).map((s) => [s.roleId, s.max]))
    : {};

  const total = readOnly ? 0 : sum(Object.values(roleCounts));

  return (
    <div className="mt-5">
      <h2 className="text-lg font-semibold mb-2">Configure Roles</h2>
      {!readOnly && (
        <p className="text-sm text-muted-foreground mb-3">
          {isAdvanced
            ? `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (min total: ${String(sum(Object.values(roleMins)))}, max total: ${String(sum(Object.values(roleMaxes)))})`
            : `Assign ${String(playerCount)} role${playerCount !== 1 ? "s" : ""} (${String(total)}/${String(playerCount)} assigned)`}
        </p>
      )}
      <ul className="space-y-1 list-none p-0">
        {Object.values(roleDefinitions).map((role) =>
          readOnly ? (
            <RoleConfigEntry
              key={role.id}
              role={role}
              gameMode={gameMode}
              isAdvanced={isAdvanced}
              min={readOnlyMin[role.id] ?? 0}
              max={readOnlyMax[role.id] ?? 0}
              readOnly={true}
            />
          ) : (
            <RoleConfigEntry
              key={role.id}
              role={role}
              gameMode={gameMode}
              isAdvanced={isAdvanced}
              readOnly={false}
              disabled={props.disabled}
            />
          ),
        )}
      </ul>
    </div>
  );
}
