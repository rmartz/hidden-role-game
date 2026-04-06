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
 * Pass axis (top row): cards available to pass. When a card is selected for
 * discard its slot becomes an invisible placeholder to preserve column width.
 *
 * Discard axis (bottom row): empty for unselected columns. The selected column
 * shows the card (ghosted) with a ✕ overlay, so the player can see exactly
 * which card type they are discarding before submitting.
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
        const cardLabel = isGood
          ? themeLabels.goodPolicy
          : themeLabels.badPolicy;
        const cardColorClass = isGood
          ? "border-green-500 text-green-700"
          : "border-red-500 text-red-700";

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => {
              onSelectDiscard(i);
            }}
            className="flex flex-col gap-2 items-center"
            data-testid={`policy-card-column-${String(i)}`}
            aria-pressed={isDiscard}
          >
            {/* Pass row: show card normally, or an invisible spacer when discarded */}
            <div
              className={cn(
                "rounded border-2 px-3 py-2 text-sm font-medium w-full text-center",
                isDiscard ? "invisible" : cardColorClass,
              )}
              data-testid={`policy-card-${String(i)}`}
            >
              {cardLabel}
            </div>

            {/* Discard row: empty when not selected; coloured card with ✕ when selected */}
            <div
              className={cn(
                "relative flex items-center justify-center rounded border-2 px-3 py-2 text-sm font-medium w-full text-center",
                isDiscard
                  ? cn(cardColorClass, "opacity-50")
                  : "border-dashed border-muted invisible",
              )}
              data-testid={`policy-discard-cell-${String(i)}`}
            >
              {/* Label hidden — colour conveys card type; see #430 for a11y follow-up */}
              <span className="invisible">{cardLabel}</span>
              {isDiscard && (
                <span className="absolute inset-0 flex items-center justify-center font-bold text-base pointer-events-none">
                  ✕
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
