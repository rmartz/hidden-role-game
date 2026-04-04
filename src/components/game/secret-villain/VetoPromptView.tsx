"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

interface VetoPromptViewProps {
  onAccept: () => void;
  onReject: () => void;
  isPending?: boolean;
}

export function VetoPromptView({
  onAccept,
  onReject,
  isPending,
}: VetoPromptViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{SECRET_VILLAIN_COPY.policy.presidentHeading}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.policy.presidentVetoPrompt}
        </p>
        <div className="flex gap-2">
          <Button onClick={onAccept} disabled={!!isPending}>
            {SECRET_VILLAIN_COPY.policy.acceptVeto}
          </Button>
          <Button variant="outline" onClick={onReject} disabled={!!isPending}>
            {SECRET_VILLAIN_COPY.policy.rejectVeto}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
