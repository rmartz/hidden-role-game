"use client";

import { useEffect, useRef } from "react";
import { GameMode, RoleConfigMode, ShowRolesInPlay } from "@/lib/models";
import { GAME_MODES } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/models";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  initFromServer,
  setGameMode,
  setRoleConfigMode,
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

const SHOW_ROLES_LABELS: Record<ShowRolesInPlay, string> = {
  [ShowRolesInPlay.None]: "None",
  [ShowRolesInPlay.ConfiguredOnly]: "Configured roles only",
  [ShowRolesInPlay.AssignedRolesOnly]: "Assigned roles only",
  [ShowRolesInPlay.RoleAndCount]: "Role and count",
};

export default function GameConfigurationPanel(props: Props) {
  const { config, playerCount, readOnly } = props;

  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);
  const showConfigToPlayers = useAppSelector(
    (s) => s.gameConfig.showConfigToPlayers,
  );
  const showRolesInPlay = useAppSelector((s) => s.gameConfig.showRolesInPlay);
  const roleConfigMode = useAppSelector((s) => s.gameConfig.roleConfigMode);
  const roleCounts = useAppSelector((s) => s.gameConfig.roleCounts);
  const roleMins = useAppSelector((s) => s.gameConfig.roleMins);
  const roleMaxes = useAppSelector((s) => s.gameConfig.roleMaxes);
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

  const activeGameMode = readOnly ? config.gameMode : selectedGameMode;
  const roleDefinitions = GAME_MODES[activeGameMode].roles;
  const ownerTitle = GAME_MODES[activeGameMode].ownerTitle;
  const roleSlotsRequired = playerCount - (ownerTitle ? 1 : 0);

  const activeRoleConfigMode = readOnly
    ? config.roleConfigMode
    : roleConfigMode;

  const roleSlots: RoleSlot[] =
    activeRoleConfigMode === RoleConfigMode.Advanced
      ? Object.keys(roleDefinitions)
          .filter((id) => (roleMaxes[id] ?? 0) > 0)
          .map((id) => ({
            roleId: id,
            min: roleMins[id] ?? 0,
            max: roleMaxes[id] ?? 0,
          }))
      : Object.entries(roleCounts)
          .filter(([, count]) => count > 0)
          .map(([roleId, count]) => ({ roleId, min: count, max: count }));

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
          Show roles in play:{" "}
          <select
            value={readOnly ? config.showRolesInPlay : showRolesInPlay}
            disabled={readOnly || props.isPending}
            onChange={
              readOnly
                ? undefined
                : (e) => {
                    dispatch(
                      setShowRolesInPlay(e.target.value as ShowRolesInPlay),
                    );
                  }
            }
          >
            {Object.values(ShowRolesInPlay).map((opt) => (
              <option key={opt} value={opt}>
                {SHOW_ROLES_LABELS[opt]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ownerTitle && (
        <p style={{ marginTop: "10px" }}>
          {readOnly
            ? `This game has a ${ownerTitle} who can see all roles.`
            : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`}
        </p>
      )}

      {!readOnly && (
        <div style={{ marginTop: "10px" }}>
          <span>Role configuration: </span>
          {Object.values(RoleConfigMode).map((mode) => (
            <label key={mode} style={{ marginRight: "12px" }}>
              <input
                type="radio"
                name="roleConfigMode"
                value={mode}
                checked={roleConfigMode === mode}
                disabled={props.isPending}
                onChange={() => {
                  dispatch(setRoleConfigMode(mode));
                }}
              />{" "}
              {mode}
            </label>
          ))}
        </div>
      )}

      {readOnly ? (
        <RoleConfig
          roleDefinitions={roleDefinitions}
          roleSlots={config.roleSlots}
          roleConfigMode={config.roleConfigMode}
          playerCount={playerCount}
          readOnly={true}
        />
      ) : (
        <>
          <RoleConfig
            roleDefinitions={roleDefinitions}
            playerCount={roleSlotsRequired}
            readOnly={false}
            disabled={
              props.isPending || roleConfigMode === RoleConfigMode.Default
            }
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
