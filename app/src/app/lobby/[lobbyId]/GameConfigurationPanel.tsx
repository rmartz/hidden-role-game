"use client";

import { useState } from "react";
import { GameMode } from "@/lib/models";
import type { RoleDefinition } from "@/lib/models";
import { GAME_MODE_NAMES } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/models";
import RoleConfig from "./RoleConfig";

interface ReadOnlyProps {
  config: GameConfig;
  roleDefinitions: RoleDefinition[];
  playerCount: number;
  readOnly: true;
}

interface EditableProps {
  config: GameConfig;
  roleDefinitions: RoleDefinition[];
  playerCount: number;
  readOnly: false;
  selectedGameMode: GameMode;
  isPending: boolean;
  onGameModeChange: (mode: GameMode) => void;
  onShowConfigChange: (value: boolean) => void;
  onShowRolesInPlayChange: (value: boolean) => void;
  onRoleSlotsChange: (roleSlots: RoleSlot[]) => void;
  onStartGame: (roleSlots: RoleSlot[]) => void;
}

type Props = ReadOnlyProps | EditableProps;

export default function GameConfigurationPanel(props: Props) {
  const { config, roleDefinitions, playerCount, readOnly } = props;

  const [currentRoleSlots, setCurrentRoleSlots] = useState<RoleSlot[]>(
    config.roleSlots ?? [],
  );

  const totalSlots = currentRoleSlots.reduce((sum, s) => sum + s.count, 0);
  const isValid = totalSlots === playerCount;

  function handleRoleSlotsChange(roleSlots: RoleSlot[]) {
    setCurrentRoleSlots(roleSlots);
    if (!readOnly) props.onRoleSlotsChange(roleSlots);
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {readOnly ? (
        <p>Game Mode: {GAME_MODE_NAMES[config.gameMode]}</p>
      ) : (
        <label>
          Game Mode:{" "}
          <select
            value={props.selectedGameMode}
            onChange={(e) => props.onGameModeChange(e.target.value as GameMode)}
          >
            {Object.values(GameMode).map((mode) => (
              <option key={mode} value={mode}>
                {GAME_MODE_NAMES[mode]}
              </option>
            ))}
          </select>
        </label>
      )}

      <div
        style={{
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={config.showConfigToPlayers}
            disabled={readOnly || props.isPending}
            onChange={
              readOnly
                ? undefined
                : (e) => props.onShowConfigChange(e.target.checked)
            }
          />{" "}
          Show game configuration to all players
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.showRolesInPlay}
            disabled={readOnly || props.isPending}
            onChange={
              readOnly
                ? undefined
                : (e) => props.onShowRolesInPlayChange(e.target.checked)
            }
          />{" "}
          Show roles in play when game starts
        </label>
      </div>

      {readOnly ? (
        <RoleConfig
          roleDefinitions={roleDefinitions}
          roleSlots={config.roleSlots}
          playerCount={playerCount}
          readOnly={true}
        />
      ) : (
        <>
          <RoleConfig
            roleDefinitions={roleDefinitions}
            playerCount={playerCount}
            readOnly={false}
            disabled={props.isPending}
            onRoleSlotsChange={handleRoleSlotsChange}
          />
          <button
            onClick={() => props.onStartGame(currentRoleSlots)}
            disabled={props.isPending || !isValid}
          >
            Start Game
          </button>
        </>
      )}
    </div>
  );
}
