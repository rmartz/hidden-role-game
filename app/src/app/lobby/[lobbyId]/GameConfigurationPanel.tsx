"use client";

import { useEffect, useRef } from "react";
import { GameMode } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  initFromServer,
  setGameMode,
  setShowConfigToPlayers,
  setShowRolesInPlay,
} from "@/store/gameConfigSlice";
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
  onStartGame: (roleSlots: RoleSlot[], gameMode: GameMode) => void;
}

type Props = ReadOnlyProps | EditableProps;

export default function GameConfigurationPanel(props: Props) {
  const { config, playerCount, readOnly } = props;

  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);
  const showConfigToPlayers = useAppSelector(
    (s) => s.gameConfig.showConfigToPlayers,
  );
  const showRolesInPlay = useAppSelector((s) => s.gameConfig.showRolesInPlay);
  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);
  const isValid = useAppSelector((s) => s.gameConfig.isValid);

  // Sync Redux state from server when server config changes (e.g. player joins/leaves).
  const lastServerConfigRef = useRef<string | null>(null);
  useEffect(() => {
    if (readOnly) return;
    const incoming = JSON.stringify({ config, playerCount });
    if (incoming === lastServerConfigRef.current) return;
    lastServerConfigRef.current = incoming;
    dispatch(initFromServer({ config, playerCount }));
  }, [config, playerCount, readOnly, dispatch]);

  const roleDefinitions =
    GAME_MODES[readOnly ? config.gameMode : selectedGameMode].roles;
  const ownerTitle =
    GAME_MODES[readOnly ? config.gameMode : selectedGameMode].ownerTitle;
  const roleSlotsRequired = playerCount - (ownerTitle ? 1 : 0);

  const roleSlots: RoleSlot[] = Object.entries(roleCounts)
    .filter(([, count]) => count > 0)
    .map(([roleId, count]) => ({ roleId, count }));

  return (
    <div style={{ marginTop: "20px" }}>
      {readOnly ? (
        <p>Game Mode: {GAME_MODES[config.gameMode].name}</p>
      ) : (
        <label>
          Game Mode:{" "}
          <select
            value={selectedGameMode}
            onChange={(e) => {
              dispatch(setGameMode(e.target.value as GameMode));
            }}
          >
            {Object.values(GameMode).map((mode) => (
              <option key={mode} value={mode}>
                {GAME_MODES[mode].name}
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
            checked={
              readOnly ? config.showConfigToPlayers : showConfigToPlayers
            }
            disabled={readOnly || props.isPending}
            onChange={
              readOnly
                ? undefined
                : (e) => {
                    dispatch(setShowConfigToPlayers(e.target.checked));
                  }
            }
          />{" "}
          Show game configuration to all players
        </label>
        <label>
          <input
            type="checkbox"
            checked={readOnly ? config.showRolesInPlay : showRolesInPlay}
            disabled={readOnly || props.isPending}
            onChange={
              readOnly
                ? undefined
                : (e) => {
                    dispatch(setShowRolesInPlay(e.target.checked));
                  }
            }
          />{" "}
          Show roles in play when game starts
        </label>
      </div>

      {ownerTitle && (
        <p style={{ marginTop: "10px" }}>
          {readOnly
            ? `This game has a ${ownerTitle} who can see all roles.`
            : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`}
        </p>
      )}

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
            playerCount={roleSlotsRequired}
            readOnly={false}
            disabled={props.isPending}
          />
          <button
            onClick={() => {
              props.onStartGame(roleSlots, selectedGameMode);
            }}
            disabled={props.isPending || !isValid}
          >
            Start Game
          </button>
        </>
      )}
    </div>
  );
}
