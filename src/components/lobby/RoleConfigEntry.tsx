"use client";

import type { GameMode, RoleDefinition, Team } from "@/lib/types";
import { RoleConfigMode } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  incrementRoleCount,
  decrementRoleCount,
} from "@/store/game-config-slice";
import { RoleLabel } from "@/components/RoleLabel";
import type { IncrementDirection } from "./Incrementer";
import { Incrementer } from "./Incrementer";

interface ReadOnlyProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  count: number;
  readOnly: true;
  dimmed?: boolean;
}

interface EditableProps {
  role: RoleDefinition<string, Team>;
  gameMode: GameMode;
  roleConfigMode: RoleConfigMode;
  readOnly: false;
  disabled: boolean;
  dimmed?: boolean;
}

type RoleConfigEntryProps = ReadOnlyProps | EditableProps;

export function RoleConfigEntry(props: RoleConfigEntryProps) {
  const { role, gameMode, roleConfigMode, readOnly, dimmed } = props;

  const dispatch = useAppDispatch();
  const count = useAppSelector((s) => s.gameConfig.roleCounts[role.id] ?? 0);

  function handleCountChange(direction: IncrementDirection) {
    if (direction === "increment") {
      dispatch(incrementRoleCount(role.id));
    } else {
      dispatch(decrementRoleCount(role.id));
    }
  }

  return (
    <li
      className={`py-1 grid grid-cols-[1fr_auto] items-center gap-2 ${dimmed ? "text-muted-foreground" : ""}`}
    >
      <span className="flex items-center gap-1">
        <RoleLabel role={role} gameMode={gameMode} />
      </span>
      {readOnly ? (
        <span className="text-sm">{props.count}</span>
      ) : roleConfigMode === RoleConfigMode.Custom ? (
        <div className="flex items-center gap-1">
          <Incrementer
            value={count}
            onChange={handleCountChange}
            disabled={props.disabled}
            minValue={0}
          />
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">{count}</span>
      )}
    </li>
  );
}
