"use client";

import { useEffect, useRef } from "react";
import { GameMode } from "@/lib/types";
import { GAME_MODES, getRoleSlotsRequired } from "@/lib/game-modes";
import type { GameConfig, RoleSlot } from "@/server/types";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loadConfig,
  selectRoleSlots,
  setNominationEnabled,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
  setTimerConfig,
} from "@/store/game-config-slice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationToggles } from "./ConfigurationToggles";
import { RoleConfig } from "./RoleConfig";
import { GameModePicker } from "./GameModePicker";
import { ShowRolesInPlayPicker } from "./ShowRolesInPlayPicker";
import { WerewolfConfigPanel } from "./WerewolfConfigPanel";

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

type GameConfigurationPanelProps = ReadOnlyProps | EditableProps;

export function GameConfigurationPanel(props: GameConfigurationPanelProps) {
  const { config, playerCount, readOnly } = props;

  const dispatch = useAppDispatch();
  const selectedGameMode = useAppSelector((s) => s.gameConfig.gameMode);
  const showConfigToPlayers = useAppSelector(
    (s) => s.gameConfig.showConfigToPlayers,
  );
  const showRolesInPlay = useAppSelector((s) => s.gameConfig.showRolesInPlay);
  const roleConfigMode = useAppSelector((s) => s.gameConfig.roleConfigMode);
  const roleSlots = useAppSelector((s) => selectRoleSlots(s.gameConfig));
  const timerConfig = useAppSelector((s) => s.gameConfig.timerConfig);
  const nominationEnabled = useAppSelector(
    (s) => s.gameConfig.nominationEnabled,
  );
  const isValid = useAppSelector((s) => s.gameConfig.isValid);

  const hasLoadedRef = useRef(false);
  const prevPlayerCountRef = useRef(playerCount);
  useEffect(() => {
    if (readOnly) return;
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      prevPlayerCountRef.current = playerCount;
      dispatch(loadConfig({ config, playerCount }));
      return;
    }
    if (prevPlayerCountRef.current !== playerCount) {
      prevPlayerCountRef.current = playerCount;
      dispatch(setPlayerCount(playerCount));
    }
  }, [config, playerCount, readOnly, dispatch]);

  const activeGameMode = readOnly ? config.gameMode : selectedGameMode;
  const activeModeConfig = GAME_MODES[activeGameMode];
  const roleDefinitions = activeModeConfig.roles;
  const ownerTitle = activeModeConfig.ownerTitle;
  const roleSlotsRequired = getRoleSlotsRequired(activeGameMode, playerCount);
  const disabled = readOnly ? true : props.isPending;
  const isWerewolf = activeGameMode === GameMode.Werewolf;

  const resolved = readOnly
    ? {
        showRolesInPlay: config.showRolesInPlay,
        showConfigToPlayers: config.showConfigToPlayers,
        timerConfig: config.timerConfig,
        nominationEnabled: (config.nominationThreshold ?? 0) > 0,
        onShowRolesInPlayChange: undefined,
        onShowConfigToPlayersChange: undefined,
        onTimerConfigChange: undefined,
        onNominationEnabledChange: undefined,
      }
    : {
        showRolesInPlay,
        showConfigToPlayers,
        timerConfig,
        nominationEnabled,
        onShowRolesInPlayChange: (value: typeof showRolesInPlay) =>
          dispatch(setShowRolesInPlay(value)),
        onShowConfigToPlayersChange: (value: boolean) =>
          dispatch(setShowConfigToPlayers(value)),
        onTimerConfigChange: (value: typeof timerConfig) =>
          dispatch(setTimerConfig(value)),
        onNominationEnabledChange: (value: boolean) =>
          dispatch(setNominationEnabled(value)),
      };

  const ownerTitleText = ownerTitle
    ? readOnly
      ? `This game has a ${ownerTitle} who can see all roles.`
      : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`
    : null;

  const werewolfConfig = isWerewolf ? (
    <WerewolfConfigPanel
      timerConfig={resolved.timerConfig}
      nominationEnabled={resolved.nominationEnabled}
      disabled={disabled}
      onTimerConfigChange={resolved.onTimerConfigChange}
      onNominationEnabledChange={resolved.onNominationEnabledChange}
    />
  ) : null;

  return (
    <>
      {readOnly ? (
        <p className="text-sm">
          Game Mode: <strong>{GAME_MODES[config.gameMode].name}</strong>
        </p>
      ) : (
        <GameModePicker />
      )}
      <Card className="@container mb-5">
        <CardHeader>
          <CardTitle>Game Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-6 @md:grid-cols-2">
            <div>
              {readOnly ? (
                <RoleConfig
                  roleDefinitions={roleDefinitions}
                  roleSlots={config.roleSlots}
                  roleConfigMode={config.roleConfigMode}
                  playerCount={playerCount}
                  gameMode={activeGameMode}
                  readOnly={true}
                />
              ) : (
                <RoleConfig
                  roleDefinitions={roleDefinitions}
                  playerCount={roleSlotsRequired}
                  roleConfigMode={roleConfigMode}
                  gameMode={selectedGameMode}
                  readOnly={false}
                  disabled={props.isPending}
                />
              )}
            </div>
            <div>
              <ShowRolesInPlayPicker
                value={resolved.showRolesInPlay}
                disabled={disabled}
                onChange={resolved.onShowRolesInPlayChange}
              />
            </div>
          </div>

          <ConfigurationToggles
            showConfigToPlayers={resolved.showConfigToPlayers}
            disabled={disabled}
            onShowConfigToPlayersChange={resolved.onShowConfigToPlayersChange}
          />

          {werewolfConfig}

          {ownerTitleText && (
            <p className="text-sm text-muted-foreground">{ownerTitleText}</p>
          )}

          {!readOnly && (
            <Button
              onClick={() => {
                props.onStartGame(roleSlots, selectedGameMode);
              }}
              disabled={props.isPending || !isValid}
            >
              Start Game
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
