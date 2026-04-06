"use client";

import { GAME_MODES } from "@/lib/game/modes";
import type { GameMode } from "@/lib/types";
import type { PublicRoleInfo } from "@/server/types";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ROLE_LABEL_COPY } from "@/components/RoleLabel.copy";

interface RoleLabelProps {
  role: PublicRoleInfo;
  gameMode?: GameMode;
  showTeam?: boolean;
  disableDialog?: boolean;
}

export function RoleLabel({
  role,
  gameMode,
  showTeam = false,
  disableDialog = false,
}: RoleLabelProps) {
  const modeConfig = gameMode ? GAME_MODES[gameMode] : undefined;
  const teamLabel = modeConfig?.teamLabels[role.team] ?? role.team;
  const fullRole = modeConfig?.roles[role.id];
  const hasInfo =
    !disableDialog && !!(fullRole?.summary ?? fullRole?.description);

  const teamRevealClass = showTeam
    ? "max-w-[10rem] opacity-100"
    : "max-w-0 opacity-0 group-hover:max-w-[10rem] group-hover:opacity-100";

  const badge = (
    <Badge
      variant="secondary"
      className={!hasInfo && !showTeam ? "group" : undefined}
    >
      {role.name}
      <span
        className={`inline-block overflow-hidden whitespace-nowrap transition-all duration-500 ${teamRevealClass}`}
      >
        &nbsp;({teamLabel})
      </span>
      {hasInfo && <InfoIcon className="opacity-60" />}
    </Badge>
  );

  return hasInfo ? (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="group inline-flex hover:opacity-80"
          />
        }
      >
        {badge}
        <span className="sr-only">{ROLE_LABEL_COPY.roleInfoSrLabel}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {ROLE_LABEL_COPY.roleDetailTitle(role.name, teamLabel)}
          </DialogTitle>
        </DialogHeader>
        {fullRole?.summary && <p className="font-medium">{fullRole.summary}</p>}
        {fullRole?.description && (
          <p className="mt-1 opacity-90">{fullRole.description}</p>
        )}
      </DialogContent>
    </Dialog>
  ) : (
    badge
  );
}
