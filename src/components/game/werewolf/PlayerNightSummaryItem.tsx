import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

interface PlayerNightSummaryItemProps {
  playerName: string;
  killed: boolean;
  altruistSacrifice: boolean;
  savedPlayerName?: string;
  protected: boolean;
  survived: boolean;
  silenced: boolean;
  hypnotized: boolean;
  smited: boolean;
  peaceful: boolean;
  isMe: boolean;
  veteranCounterkillSource?: "wolf-repel" | "protector-visit";
  veteranName?: string;
}

export function PlayerNightSummaryItem({
  playerName,
  killed,
  altruistSacrifice,
  savedPlayerName,
  protected: wasProtected,
  survived,
  silenced,
  hypnotized,
  smited,
  peaceful,
  isMe,
  veteranCounterkillSource,
  veteranName,
}: PlayerNightSummaryItemProps) {
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
      <li className="text-sm font-medium text-orange-600">
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

  if (veteranCounterkillSource && veteranName) {
    const message =
      veteranCounterkillSource === "wolf-repel"
        ? WEREWOLF_COPY.veteran.dayAnnouncementWolfRepel(
            veteranName,
            playerName,
          )
        : WEREWOLF_COPY.veteran.dayAnnouncementProtectorKilled(
            veteranName,
            playerName,
          );
    return <li className="text-sm font-medium text-orange-600">{message}</li>;
  }

  if (wasProtected) {
    return (
      <li className="text-sm font-medium text-green-600">
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
      silenced && "silenced",
      hypnotized && "hypnotized",
    ] as (string | false)[]
  )
    .filter(Boolean)
    .join(" and ");

  return (
    <li className="text-sm">
      {playerName} was {effects}.
    </li>
  );
}
