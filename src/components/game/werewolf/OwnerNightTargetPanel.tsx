"use client";

import { Button } from "@/components/ui/button";
import type { TargetablePlayer } from "@/lib/game/modes/werewolf";

interface ResolvedVote {
  key: string;
  voterName: string;
  targetName: string;
}

interface OwnerNightTargetPanelProps {
  groupAction: boolean;
  groupMemberCount?: number;
  resolvedVotes: ResolvedVote[];
  activeTargetName?: string;
  activeTargetConfirmed: boolean;
  targetablePlayers: TargetablePlayer[];
  activeTarget?: string;
  onTargetClick: (
    playerId: string | null | undefined,
    isSecondTarget?: boolean,
  ) => void;
  isPending: boolean;
  previousTargetId?: string;
  /** When true, enables dual-target selection mode (Swapper, Mentalist). */
  requiresDualTarget?: boolean;
  /** The current second selected target ID in dual-target mode. */
  secondTarget?: string;
  /**
   * State-aware prompt shown above the target buttons in dual-target mode.
   * Computed by the parent based on role and current selection state.
   */
  dualTargetPrompt?: string;
}

export function OwnerNightTargetPanel({
  groupAction,
  groupMemberCount,
  resolvedVotes,
  activeTargetName,
  activeTargetConfirmed,
  targetablePlayers,
  activeTarget,
  onTargetClick,
  isPending,
  previousTargetId,
  requiresDualTarget = false,
  secondTarget,
  dualTargetPrompt,
}: OwnerNightTargetPanelProps) {
  const bothTargetsSet =
    requiresDualTarget &&
    activeTarget !== undefined &&
    secondTarget !== undefined;

  const handlePlayerClick = (playerId: string) => {
    if (!requiresDualTarget) {
      onTargetClick(activeTarget === playerId ? undefined : playerId);
      return;
    }

    if (playerId === activeTarget) {
      // Deselect first target.
      onTargetClick(undefined);
    } else if (playerId === secondTarget) {
      // Deselect second target.
      onTargetClick(undefined, true);
    } else if (activeTarget === undefined) {
      // No first target — set as first.
      onTargetClick(playerId);
    } else if (secondTarget === undefined) {
      // First target set, no second — set as second.
      onTargetClick(playerId, true);
    }
    // Both targets already set and this player is neither: button is disabled.
  };

  return (
    <div className="mb-4 rounded-md border p-3">
      {groupAction &&
        (groupMemberCount === undefined || groupMemberCount > 1) && (
          <div className="mb-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Votes:
            </p>
            {resolvedVotes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No votes yet
              </p>
            ) : (
              <ul className="text-xs space-y-0.5">
                {resolvedVotes.map((vote) => (
                  <li key={vote.key}>
                    {vote.voterName} → {vote.targetName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      {requiresDualTarget ? (
        <p className="text-sm font-medium mb-2">{dualTargetPrompt}</p>
      ) : (
        <p className="text-sm font-medium mb-2">
          {groupAction && groupMemberCount !== undefined && groupMemberCount > 1
            ? "Suggested target: "
            : "Target: "}
          {activeTargetName ? (
            <>
              <strong className="text-foreground">{activeTargetName}</strong>
              {activeTargetConfirmed && (
                <span className="ml-1 text-xs text-green-600">(confirmed)</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground italic">none</span>
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {targetablePlayers.map((player) => (
          <Button
            key={player.id}
            size="sm"
            variant={
              player.id === activeTarget || player.id === secondTarget
                ? "default"
                : "outline"
            }
            onClick={() => {
              handlePlayerClick(player.id);
            }}
            disabled={
              isPending ||
              player.id === previousTargetId ||
              (requiresDualTarget &&
                bothTargetsSet &&
                player.id !== activeTarget &&
                player.id !== secondTarget)
            }
          >
            {player.name}
            {player.id === previousTargetId && " (unavailable)"}
          </Button>
        ))}
        <Button
          size="sm"
          variant={
            requiresDualTarget
              ? activeTarget === undefined && secondTarget === undefined
                ? "default"
                : "outline"
              : activeTarget === undefined
                ? "default"
                : "outline"
          }
          onClick={() => {
            // For dual-target: No Target clears all selections (sets skipped=true).
            // For single-target: Skip deselects the current target.
            onTargetClick(requiresDualTarget ? null : undefined);
          }}
          disabled={isPending}
        >
          {requiresDualTarget ? "No Target" : "Skip"}
        </Button>
      </div>
    </div>
  );
}
