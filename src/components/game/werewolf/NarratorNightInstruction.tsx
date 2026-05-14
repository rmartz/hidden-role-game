import type { NarratorInstruction } from "@/lib/game/modes/werewolf";

import { NARRATOR_NIGHT_INSTRUCTION_COPY } from "./NarratorNightInstruction.copy";

interface NarratorNightInstructionProps {
  instruction: NarratorInstruction;
}

export function NarratorNightInstruction({
  instruction,
}: NarratorNightInstructionProps) {
  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-3 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">
        {NARRATOR_NIGHT_INSTRUCTION_COPY.heading}
      </p>
      {instruction.preWake && (
        <p className="mb-1 text-foreground">
          &ldquo;{instruction.preWake}&rdquo;
        </p>
      )}
      <p className="text-foreground">
        &ldquo;{instruction.wakeInstruction}&rdquo;
      </p>
      {instruction.postWake && (
        <p className="mt-1 text-foreground">
          &ldquo;{instruction.postWake}&rdquo;
        </p>
      )}
    </div>
  );
}
