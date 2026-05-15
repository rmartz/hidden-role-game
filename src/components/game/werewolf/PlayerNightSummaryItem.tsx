import { Fragment } from "react";

import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  altruistSacrifice: boolean;
  savedPlayerName?: string;
  protected: boolean;
  knighted: boolean;
  survived: boolean;
  silenced: boolean;
  hypnotized: boolean;
  smited: boolean;
  peaceful: boolean;
  exposedRoleName?: string;
  isMe: boolean;
}

function renderPrimaryLine({
  playerName,
  killed,
  altruistSacrifice,
  savedPlayerName,
  protected: wasProtected,
  knighted,
  survived,
  silenced,
  hypnotized,
  smited,
  peaceful,
  isMe,
}: Omit<PlayerNightSummaryItemProps, "exposedRoleName">) {
  // Personal messages for silenced/hypnotized player (only visible to themselves).
  if (isMe && silenced) {
    return (
      <li className="text-sm font-medium text-amber-600">
        {WEREWOLF_COPY.silence.nightSummary}
      </li>
    );
  }

  if (isMe && hypnotized) {
    return (
      <li className="text-sm font-medium text-amber-600">
        {WEREWOLF_COPY.hypnotize.nightSummary}
      </li>
    );
  }

  // The "survived" effect is only visible to the Tough Guy themselves,
  // so use a personalized second-person message.
  if (survived) {
    const suffix = silenced ? " You have also been silenced." : "";
    return (
      <li className="text-sm font-medium text-orange-800 dark:text-orange-400">
        {WEREWOLF_COPY.day.toughGuySurvived}
        {suffix}
      </li>
    );
  }

  if (altruistSacrifice) {
    return (
      <li className="text-sm font-medium text-blue-600">
        {WEREWOLF_COPY.altruist.dayAnnouncement(
          playerName,
          savedPlayerName ?? "a player",
        )}
      </li>
    );
  }

  if (wasProtected) {
    return (
      <li className="text-sm font-medium text-green-800 dark:text-green-400">
        {WEREWOLF_COPY.day.protected(playerName)}
      </li>
    );
  }

  if (peaceful) {
    return (
      <li className="text-sm">
        {WEREWOLF_COPY.oldMan.peacefulDeath(playerName)}
      </li>
    );
  }

  const effects = (
    [
      smited && WEREWOLF_COPY.smite.effect,
      killed && !smited && "eliminated",
      knighted && "knighted",
      silenced && "silenced",
      hypnotized && "hypnotized",
    ] as (string | false)[]
  )
    .filter(Boolean)
    .join(" and ");

  if (!effects) return undefined;

  return (
    <li className="text-sm">
      {playerName} was {effects}.
    </li>
  );
}

export function PlayerNightSummaryItem({
  exposedRoleName,
  ...rest
}: PlayerNightSummaryItemProps) {
  const primaryLine = renderPrimaryLine(rest);
  const exposedLine = exposedRoleName ? (
    <li className="text-sm font-medium text-purple-700 dark:text-purple-400">
      {WEREWOLF_COPY.exposer.nightSummary(rest.playerName, exposedRoleName)}
    </li>
  ) : undefined;

  return (
    <Fragment>
      {primaryLine}
      {exposedLine}
    </Fragment>
  );
}
