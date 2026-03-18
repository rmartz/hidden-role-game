"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LOBBY_CONFIG_COPY } from "./copy";

interface ConfigurationTogglesProps {
  showConfigToPlayers: boolean;
  disabled?: boolean;
  onShowConfigToPlayersChange?: (value: boolean) => void;
}

export function ConfigurationToggles({
  showConfigToPlayers,
  disabled,
  onShowConfigToPlayersChange,
}: ConfigurationTogglesProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        id="show-config"
        checked={showConfigToPlayers}
        disabled={disabled}
        onCheckedChange={onShowConfigToPlayersChange}
      />
      <Label htmlFor="show-config">
        {LOBBY_CONFIG_COPY.showConfigToPlayers}
      </Label>
    </div>
  );
}
