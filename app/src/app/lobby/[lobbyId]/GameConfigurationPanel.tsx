"use client";

import { useEffect, useRef, useState } from "react";
import { GameMode } from "@/lib/models";
import {
  GAME_MODE_NAMES,
  GAME_MODE_ROLES,
  getDefaultRoleSlots,
} from "@/lib/game-modes";
import type {
  GameConfig,
  RoleSlot,
  UpdateLobbyConfigRequest,
} from "@/server/models";
import RoleConfig from "./RoleConfig";

interface ReadOnlyProps {
  config: GameConfig;
  playerCount: number;
  readOnly: true;
}

interface EditableProps {
  config: GameConfig;
  playerCount: number;
  readOnly: false;
  isPending: boolean;
  onConfigChange: (config: UpdateLobbyConfigRequest) => void;
  onStartGame: (roleSlots: RoleSlot[], gameMode: GameMode) => void;
}

type Props = ReadOnlyProps | EditableProps;

export default function GameConfigurationPanel(props: Props) {
  const { config, playerCount, readOnly } = props;

  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>(
    config.gameMode,
  );
  const [showConfigToPlayers, setShowConfigToPlayers] = useState(
    config.showConfigToPlayers,
  );
  const [showRolesInPlay, setShowRolesInPlay] = useState(
    config.showRolesInPlay,
  );
  const [currentRoleSlots, setCurrentRoleSlots] = useState<RoleSlot[]>(
    config.roleSlots ?? [],
  );
  const [roleConfigKey, setRoleConfigKey] = useState(0);

  const isFirstRender = useRef(true);
  const lastServerRoleSlotsJson = useRef(JSON.stringify(config.roleSlots));

  // Sync role counts when the server updates them (e.g. a player leaves and slots are trimmed)
  useEffect(() => {
    if (readOnly) return;
    const incoming = JSON.stringify(config.roleSlots);
    if (incoming !== lastServerRoleSlotsJson.current) {
      lastServerRoleSlotsJson.current = incoming;
      setCurrentRoleSlots(config.roleSlots ?? []);
      setRoleConfigKey((k) => k + 1);
    }
  }, [config.roleSlots, readOnly]);

  useEffect(() => {
    if (readOnly) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      props.onConfigChange({
        gameMode: selectedGameMode,
        showConfigToPlayers,
        showRolesInPlay,
        roleSlots: currentRoleSlots,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [
    selectedGameMode,
    showConfigToPlayers,
    showRolesInPlay,
    currentRoleSlots,
  ]);

  const roleDefinitions =
    GAME_MODE_ROLES[readOnly ? config.gameMode : selectedGameMode];
  const totalSlots = currentRoleSlots.reduce((sum, s) => sum + s.count, 0);
  const isValid = totalSlots === playerCount;

  return (
    <div style={{ marginTop: "20px" }}>
      {readOnly ? (
        <p>Game Mode: {GAME_MODE_NAMES[config.gameMode]}</p>
      ) : (
        <label>
          Game Mode:{" "}
          <select
            value={selectedGameMode}
            onChange={(e) => {
              const newMode = e.target.value as GameMode;
              setSelectedGameMode(newMode);
              setCurrentRoleSlots(getDefaultRoleSlots(newMode, playerCount));
              setRoleConfigKey((k) => k + 1);
            }}
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
            checked={showConfigToPlayers}
            disabled={readOnly || props.isPending}
            onChange={
              readOnly
                ? undefined
                : (e) => setShowConfigToPlayers(e.target.checked)
            }
          />{" "}
          Show game configuration to all players
        </label>
        <label>
          <input
            type="checkbox"
            checked={showRolesInPlay}
            disabled={readOnly || props.isPending}
            onChange={
              readOnly ? undefined : (e) => setShowRolesInPlay(e.target.checked)
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
            key={roleConfigKey}
            roleDefinitions={roleDefinitions}
            roleSlots={currentRoleSlots}
            playerCount={playerCount}
            readOnly={false}
            disabled={props.isPending}
            onRoleSlotsChange={setCurrentRoleSlots}
          />
          <button
            onClick={() =>
              props.onStartGame(currentRoleSlots, selectedGameMode)
            }
            disabled={props.isPending || !isValid}
          >
            Start Game
          </button>
        </>
      )}
    </div>
  );
}
