import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OwnerAdvanceCardProps {
  label: string;
  onAdvance: () => void;
  disabled?: boolean;
  /** When set, renders the advance button as destructive with this tooltip. */
  unconfirmedWarning?: string;
  children?: ReactNode;
}

export function OwnerAdvanceCard({
  label,
  onAdvance,
  disabled,
  unconfirmedWarning,
  children,
}: OwnerAdvanceCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        {children}
        <div className="flex justify-center mt-2">
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button
                onClick={onAdvance}
                disabled={disabled}
                variant={unconfirmedWarning ? "secondary" : "default"}
              >
                {label}
              </Button>
            </TooltipTrigger>
            {unconfirmedWarning && (
              <TooltipContent>{unconfirmedWarning}</TooltipContent>
            )}
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
