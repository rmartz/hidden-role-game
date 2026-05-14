"use client";

import { Badge } from "@/components/ui/badge";

import { NIGHT_ACTION_MARKER_COPY } from "./NightActionMarker.copy";

export enum NightMarkerEffect {
  Attacked = "attacked",
  Hypnotized = "hypnotized",
  Investigated = "investigated",
  Protected = "protected",
  Silenced = "silenced",
  Special = "special",
}

const BADGE_CLASS: Record<NightMarkerEffect, string> = {
  [NightMarkerEffect.Attacked]:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  [NightMarkerEffect.Hypnotized]:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  [NightMarkerEffect.Investigated]:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  [NightMarkerEffect.Protected]:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  [NightMarkerEffect.Silenced]:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  [NightMarkerEffect.Special]:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

interface NightActionMarkerProps {
  effect: NightMarkerEffect;
}

export function NightActionMarker({ effect }: NightActionMarkerProps) {
  return (
    <Badge
      className={BADGE_CLASS[effect]}
      title={NIGHT_ACTION_MARKER_COPY[effect]}
      aria-label={NIGHT_ACTION_MARKER_COPY[effect]}
    >
      {NIGHT_ACTION_MARKER_COPY[effect]}
    </Badge>
  );
}
