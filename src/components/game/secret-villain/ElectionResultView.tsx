"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";

interface ElectionResultViewProps {
  presidentName: string;
  chancellorNomineeName: string;
  passed: boolean;
  votes: { playerName: string; vote: "yes" | "no" }[];
  onContinue: () => void;
  isPending?: boolean;
  /** Theme-specific label for the yes vote. Defaults to copy constant. */
  voteYesLabel?: string;
  /** Theme-specific label for the no vote. Defaults to copy constant. */
  voteNoLabel?: string;
}

export function ElectionResultView({
  presidentName,
  chancellorNomineeName,
  passed,
  votes,
  onContinue,
  isPending,
  voteYesLabel,
  voteNoLabel,
}: ElectionResultViewProps) {
  const yesCount = votes.filter((v) => v.vote === "yes").length;
  const noCount = votes.filter((v) => v.vote === "no").length;
  const yesLabel = voteYesLabel ?? SECRET_VILLAIN_COPY.election.yes;
  const noLabel = voteNoLabel ?? SECRET_VILLAIN_COPY.election.no;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {passed
            ? SECRET_VILLAIN_COPY.election.resultPassed
            : SECRET_VILLAIN_COPY.election.resultFailed}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          {SECRET_VILLAIN_COPY.election.voteInstructions(
            presidentName,
            chancellorNomineeName,
          )}
        </p>

        <div className="flex gap-4 text-sm font-medium">
          <span>{SECRET_VILLAIN_COPY.election.yesCount(yesCount)}</span>
          <span>{SECRET_VILLAIN_COPY.election.noCount(noCount)}</span>
        </div>

        <ul className="space-y-1">
          {votes.map((v) => (
            <li key={v.playerName} className="text-sm flex justify-between">
              <span>{v.playerName}</span>
              <span className="text-muted-foreground">
                {v.vote === "yes" ? yesLabel : noLabel}
              </span>
            </li>
          ))}
        </ul>

        <Button onClick={onContinue} disabled={!!isPending}>
          {SECRET_VILLAIN_COPY.specialAction.done}
        </Button>
      </CardContent>
    </Card>
  );
}
