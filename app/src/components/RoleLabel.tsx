"use client";

import { GAME_MODES } from "@/lib/game-modes";
import type { GameMode } from "@/lib/types";
import type { PublicRoleInfo } from "@/server/types";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoleLabelProps {
  role: PublicRoleInfo;
  gameMode?: GameMode;
}

export function RoleLabel({ role, gameMode }: RoleLabelProps) {
  const modeConfig = gameMode ? GAME_MODES[gameMode] : undefined;
  const teamLabel = modeConfig?.teamLabels[role.team] ?? role.team;
  const fullRole = modeConfig?.roles[role.id];
  const hasInfo = !!(fullRole?.summary ?? fullRole?.description);

  const badge = (
    <Badge variant="secondary" className={hasInfo ? undefined : "group"}>
      {role.name}
      <span className="inline-block overflow-hidden max-w-0 opacity-0 group-hover:max-w-[10rem] group-hover:opacity-100 transition-all duration-500 whitespace-nowrap">
        &nbsp;({teamLabel})
      </span>
      {hasInfo && <InfoIcon className="opacity-60" />}
    </Badge>
  );

  return hasInfo ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="group inline-flex hover:opacity-80"
            />
          }
        >
          {badge}
          <span className="sr-only">Role information</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-64 text-wrap flex-col items-start"
        >
          {fullRole?.summary && (
            <p className="font-medium">{fullRole.summary}</p>
          )}
          {fullRole?.description && (
            <p className="mt-1 opacity-90">{fullRole.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    badge
  );
}
