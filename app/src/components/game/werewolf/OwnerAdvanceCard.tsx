import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  label: string;
  onAdvance: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

export function OwnerAdvanceCard({
  label,
  onAdvance,
  disabled,
  children,
}: Props) {
  return (
    <Card>
      <CardContent className="pt-4">
        {children}
        <div className="flex justify-center mt-2">
          <Button onClick={onAdvance} disabled={disabled}>
            {label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
