"use client";

import type { RoleDefinition, Team } from "@/lib/types";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoleTooltipProps {
  role: RoleDefinition<string, Team>;
  srLabel: string;
}

export function RoleTooltip({ role, srLabel }: RoleTooltipProps) {
  if (!role.summary && !role.description) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
            />
          }
        >
          <InfoIcon className="size-3.5" />
          <span className="sr-only">{srLabel}</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-64 text-wrap flex-col items-start"
        >
          {role.summary && <p className="font-medium">{role.summary}</p>}
          {role.description && (
            <p className="mt-1 opacity-90">{role.description}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
