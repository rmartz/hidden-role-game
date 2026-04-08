"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

interface ActionGateViewProps {
  onReveal: () => void;
}

export function ActionGateView({ onReveal }: ActionGateViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.actionGate.heading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{SECRET_VILLAIN_COPY.actionGate.description}</p>
        <Button onClick={onReveal}>
          {SECRET_VILLAIN_COPY.actionGate.begin}
        </Button>
      </CardContent>
    </Card>
  );
}
