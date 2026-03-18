"use client";

import type { ReactNode } from "react";
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
  /** Optional content rendered before the info icon, included in the tap target. */
  children?: ReactNode;
}

export function RoleTooltip({ role, srLabel, children }: RoleTooltipProps) {
  if (!role.summary && !role.description) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            />
          }
        >
          {children}
          <InfoIcon className="size-3.5 shrink-0" />
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
