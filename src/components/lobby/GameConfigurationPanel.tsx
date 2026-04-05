"use client";

import { useEffect, useRef } from "react";
import { GAME_MODES, getRoleSlotsRequired } from "@/lib/game-modes";
import type { GameConfig } from "@/server/types";
import {
  GameMode,
  isWerewolfModeConfig,
  isSecretVillainModeConfig,
} from "@/lib/types";
import type { TimerConfig } from "@/lib/types";
import type { WerewolfTimerConfig } from "@/lib/game-modes/werewolf/timer-config";
import type { SecretVillainTimerConfig } from "@/lib/game-modes/secret-villain/timer-config";
import {
  WEREWOLF_ROLE_CATEGORY_LABELS,
  WEREWOLF_ROLE_CATEGORY_ORDER,
} from "@/lib/game-modes/werewolf/roles";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  loadConfig,
  setPlayerCount,
  setShowConfigToPlayers,
  setShowRolesInPlay,
  setTimerConfig,
  updateModeConfigField,
} from "@/store/game-config-slice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationToggles } from "./ConfigurationToggles";
import { RoleConfig } from "./RoleConfig";
import { GameModePicker } from "./GameModePicker";
import { ShowRolesInPlayPicker } from "./ShowRolesInPlayPicker";
import { WerewolfConfigPanel } from "./WerewolfConfigPanel";
import { SecretVillainConfigPanel } from "./SecretVillainConfigPanel";

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
  onStartGame: () => void;
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
  const timerConfig = useAppSelector((s) => s.gameConfig.timerConfig);
  const modeConfig = useAppSelector((s) => s.gameConfig.modeConfig);
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

  const activeTimerConfig = readOnly ? config.timerConfig : timerConfig;
  const activeModeConfigData = readOnly ? config.modeConfig : modeConfig;
  const onTimerConfigChange = readOnly
    ? undefined
    : (value: TimerConfig) => dispatch(setTimerConfig(value));
  const onModeConfigFieldChange = readOnly
    ? undefined
    : (key: string, value: unknown) =>
        dispatch(updateModeConfigField({ key, value }));

  const resolved = readOnly
    ? {
        showRolesInPlay: config.showRolesInPlay,
        showConfigToPlayers: config.showConfigToPlayers,
        onShowRolesInPlayChange: undefined,
        onShowConfigToPlayersChange: undefined,
      }
    : {
        showRolesInPlay,
        showConfigToPlayers,
        onShowRolesInPlayChange: (value: typeof showRolesInPlay) =>
          dispatch(setShowRolesInPlay(value)),
        onShowConfigToPlayersChange: (value: boolean) =>
          dispatch(setShowConfigToPlayers(value)),
      };

  const ownerTitleText = ownerTitle
    ? readOnly
      ? `This game has a ${ownerTitle} who can see all roles.`
      : `You will be the ${ownerTitle} and will see all player roles. Role slots are for the remaining ${String(roleSlotsRequired)} players.`
    : null;

  const gameModePanel = isWerewolfModeConfig(activeModeConfigData) ? (
    <WerewolfConfigPanel
      timerConfig={activeTimerConfig as WerewolfTimerConfig}
      nominationEnabled={activeModeConfigData.nominationsEnabled}
      singleTrialPerDay={activeModeConfigData.singleTrialPerDay}
      revealProtections={activeModeConfigData.revealProtections}
      disabled={disabled}
      onWerewolfTimerConfigChange={
        onTimerConfigChange as
          | ((config: WerewolfTimerConfig) => void)
          | undefined
      }
      onNominationEnabledChange={
        onModeConfigFieldChange
          ? (v: boolean) => onModeConfigFieldChange("nominationsEnabled", v)
          : undefined
      }
      onSingleTrialPerDayChange={
        onModeConfigFieldChange
          ? (v: boolean) => onModeConfigFieldChange("singleTrialPerDay", v)
          : undefined
      }
      onRevealProtectionsChange={
        onModeConfigFieldChange
          ? (v: boolean) => onModeConfigFieldChange("revealProtections", v)
          : undefined
      }
    />
  ) : isSecretVillainModeConfig(activeModeConfigData) ? (
    <SecretVillainConfigPanel
      timerConfig={activeTimerConfig as SecretVillainTimerConfig}
      modeConfig={activeModeConfigData}
      disabled={disabled}
      onTimerConfigChange={
        onTimerConfigChange as
          | ((config: SecretVillainTimerConfig) => void)
          | undefined
      }
      onModeConfigFieldChange={onModeConfigFieldChange}
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
                  categoryOrder={
                    isWerewolf ? WEREWOLF_ROLE_CATEGORY_ORDER : undefined
                  }
                  categoryLabels={
                    isWerewolf ? WEREWOLF_ROLE_CATEGORY_LABELS : undefined
                  }
                />
              ) : (
                <RoleConfig
                  roleDefinitions={roleDefinitions}
                  playerCount={roleSlotsRequired}
                  roleConfigMode={roleConfigMode}
                  gameMode={selectedGameMode}
                  readOnly={false}
                  disabled={props.isPending}
                  categoryOrder={
                    isWerewolf ? WEREWOLF_ROLE_CATEGORY_ORDER : undefined
                  }
                  categoryLabels={
                    isWerewolf ? WEREWOLF_ROLE_CATEGORY_LABELS : undefined
                  }
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

          {gameModePanel}

          {ownerTitleText && (
            <p className="text-sm text-muted-foreground">{ownerTitleText}</p>
          )}

          {!readOnly && (
            <Button
              onClick={props.onStartGame}
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
