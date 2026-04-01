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
  /** Icon rendered on the left side of the advance button. */
  icon?: ReactNode;
  /** When set, shows a tooltip on the advance button with this message. */
  unconfirmedWarning?: string;
  children?: ReactNode;
}

export function OwnerAdvanceCard({
  label,
  onAdvance,
  disabled,
  icon,
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
              <Button onClick={onAdvance} disabled={disabled}>
                {icon}
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
