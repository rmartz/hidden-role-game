"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ConfigurationTogglesProps {
  showConfigToPlayers: boolean;
  nominationEnabled: boolean;
  disabled?: boolean;
  onShowConfigToPlayersChange?: (value: boolean) => void;
  onNominationEnabledChange?: (value: boolean) => void;
}

export function ConfigurationToggles({
  showConfigToPlayers,
  nominationEnabled,
  disabled,
  onShowConfigToPlayersChange,
  onNominationEnabledChange,
}: ConfigurationTogglesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Switch
          id="show-config"
          checked={showConfigToPlayers}
          disabled={disabled}
          onCheckedChange={onShowConfigToPlayersChange}
        />
        <Label htmlFor="show-config">
          Show game configuration to all players
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="nomination-enabled"
          checked={nominationEnabled}
          disabled={disabled}
          onCheckedChange={onNominationEnabledChange}
        />
        <Label htmlFor="nomination-enabled">
          Enable player nominations (2 nominations triggers a trial)
        </Label>
      </div>
    </div>
  );
}
