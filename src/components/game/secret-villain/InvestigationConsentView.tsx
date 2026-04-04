"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game-modes/secret-villain/copy";

export interface InvestigationConsentViewProps {
  presidentName: string;
  onConsent?: () => void;
  isPending?: boolean;
}

export function InvestigationConsentView({
  presidentName,
  onConsent,
  isPending,
}: InvestigationConsentViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {SECRET_VILLAIN_COPY.specialAction.investigateHeading}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.specialAction.investigateConsent(presidentName)}
        </p>
        {onConsent && (
          <Button onClick={onConsent} disabled={!!isPending}>
            {SECRET_VILLAIN_COPY.specialAction.investigateReveal}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
