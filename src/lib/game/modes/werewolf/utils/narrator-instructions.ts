import { WerewolfRole, WEREWOLF_ROLES, getWerewolfRole } from "../roles";
import { TargetCategory } from "../types";
import { baseGroupPhaseKey, isGroupPhaseKey } from "./phase-keys";

export interface NarratorInstruction {
  preWake?: string;
  wakeInstruction: string;
  postWake?: string;
}

function extraWerewolfRoleNames(activeRoleIds: Set<string>): string[] {
  return Object.values(WEREWOLF_ROLES)
    .filter(
      (r) =>
        r.isWerewolf &&
        r.id !== WerewolfRole.Werewolf &&
        activeRoleIds.has(r.id),
    )
    .map((r) => r.name);
}

export function buildNarratorInstruction(
  phaseKey: string,
  activeRoleIds: Set<string>,
): NarratorInstruction | undefined {
  const baseKey = isGroupPhaseKey(phaseKey)
    ? baseGroupPhaseKey(phaseKey)
    : phaseKey;
  const roleDef = getWerewolfRole(baseKey);
  if (!roleDef) return undefined;

  const roleName = roleDef.name;
  const hasNightActivity = roleDef.targetCategory !== TargetCategory.None;

  if (roleDef.id === WerewolfRole.Minion) {
    const extraNames = extraWerewolfRoleNames(activeRoleIds);
    const preWake =
      extraNames.length > 0
        ? `All werewolves, including ${extraNames.join(", ")}, raise your thumbs.`
        : "All Werewolves, raise your thumbs.";
    return {
      preWake,
      wakeInstruction: `Tell ${roleName} to open their eyes.`,
      postWake: "Tell them to look around, then close their eyes.",
    };
  }

  if (roleDef.id === WerewolfRole.Sentinel) {
    const preWake = activeRoleIds.has(WerewolfRole.Seer)
      ? "Tell the Seer to raise their thumb."
      : undefined;
    return {
      preWake,
      wakeInstruction: `Tell ${roleName} to open their eyes.`,
      postWake: "Tell them to look around, then close their eyes.",
    };
  }

  if (roleDef.id === WerewolfRole.Mason) {
    return {
      wakeInstruction: "Tell all Masons to open their eyes.",
      postWake: "Tell them to find each other.",
    };
  }

  if (roleDef.teamTargeting) {
    return {
      wakeInstruction: "Tell all Werewolves to open their eyes.",
      postWake: "Tell them to find their teammates and choose a target.",
    };
  }

  if (hasNightActivity) {
    return {
      wakeInstruction: `Tell ${roleName} to open their eyes.`,
      postWake: "Tell them to look at the Narrator.",
    };
  }

  return {
    wakeInstruction: `Tell ${roleName} to open their eyes.`,
  };
}
