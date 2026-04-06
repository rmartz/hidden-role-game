"use client";

import { SECRET_VILLAIN_COPY } from "@/lib/game/modes/secret-villain/copy";
import { getSvThemeLabels } from "@/lib/game/modes/secret-villain/themes";
import type { SvTheme } from "@/lib/game/modes/secret-villain/themes";
import { cn } from "@/lib/utils";

interface PolicyCardTableProps {
  cards: string[];
  discardIndex?: number;
  onSelectDiscard: (index: number) => void;
  disabled?: boolean;
  svTheme?: SvTheme;
}

/**
 * Displays policy cards in a two-row table layout.
 *
 * Top row (Pass axis): one card per column. Clicking a column marks it as the
 * card to discard, dimming it to indicate it will not be passed or played.
 *
 * Bottom row (Discard axis): shows a ✕ in the column currently selected for
 * discard, making the outcome of each choice unambiguous before submitting.
 */
export function PolicyCardTable({
  cards,
  discardIndex,
  onSelectDiscard,
  disabled,
  svTheme,
}: PolicyCardTableProps) {
  const themeLabels = getSvThemeLabels(svTheme);

  return (
    <div className="flex gap-3 items-stretch">
      <div className="flex flex-col justify-around text-xs font-medium text-muted-foreground text-right pr-1 py-1 gap-2">
        <span>{SECRET_VILLAIN_COPY.policy.passAxis}</span>
        <span>{SECRET_VILLAIN_COPY.policy.discardAxis}</span>
      </div>
      {cards.map((card, i) => {
        const isDiscard = discardIndex === i;
        const isGood = card === "good";
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => { onSelectDiscard(i); }}
            className="flex flex-col gap-2 items-center"
            data-testid={`policy-card-column-${String(i)}`}
            aria-pressed={isDiscard}
          >
            <div
              className={cn(
                "rounded border-2 px-3 py-2 text-sm font-medium w-full text-center transition-opacity",
                isGood
                  ? "border-green-500 text-green-700"
                  : "border-red-500 text-red-700",
                isDiscard && "opacity-50",
              )}
              data-testid={`policy-card-${String(i)}`}
            >
              {isGood ? themeLabels.goodPolicy : themeLabels.badPolicy}
            </div>
            <div
              className={cn(
                "flex items-center justify-center h-8 w-full rounded border-2 border-dashed text-base font-bold",
                isDiscard
                  ? "border-destructive text-destructive"
                  : "border-muted text-transparent",
              )}
              data-testid={`policy-discard-cell-${String(i)}`}
            >
              ✕
            </div>
          </button>
        );
      })}
    </div>
  );
}
