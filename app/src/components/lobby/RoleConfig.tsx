import { keyBy, mapValues, sum } from "lodash";
import type { GameMode, RoleDefinition, Team } from "@/lib/models";
import type { RoleSlot } from "@/server/models";
import { useAppSelector } from "@/store";
import { RoleConfigEntry } from "./RoleConfigEntry";

interface ReadOnlyProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  roleSlots?: RoleSlot[];
  playerCount: number;
  gameMode: GameMode;
  readOnly: true;
}

interface EditableProps {
  roleDefinitions: Record<string, RoleDefinition<string, Team>>;
  playerCount: number;
  gameMode: GameMode;
  readOnly: false;
  disabled: boolean;
}

type Props = ReadOnlyProps | EditableProps;

export function RoleConfig(props: Props) {
  const { roleDefinitions, playerCount, gameMode, readOnly } = props;

  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);

  const displayCounts = readOnly
    ? mapValues(keyBy(props.roleSlots ?? [], "roleId"), (s) => s.count)
    : roleCounts;

  const total = readOnly ? 0 : sum(Object.values(roleCounts));

  return (
    <div className="mt-5">
      <h2 className="text-lg font-semibold mb-2">Configure Roles</h2>
      {!readOnly && (
        <p className="text-sm text-muted-foreground mb-3">
          Assign {playerCount} role{playerCount !== 1 ? "s" : ""} ({total}/
          {playerCount} assigned)
        </p>
      )}
      <ul className="space-y-1 list-none p-0">
        {Object.values(roleDefinitions).map((role) =>
          readOnly ? (
            <RoleConfigEntry
              key={role.id}
              role={role}
              gameMode={gameMode}
              count={displayCounts[role.id] ?? 0}
              readOnly={true}
            />
          ) : (
            <RoleConfigEntry
              key={role.id}
              role={role}
              gameMode={gameMode}
              readOnly={false}
              disabled={props.disabled}
            />
          ),
        )}
      </ul>
    </div>
  );
}
