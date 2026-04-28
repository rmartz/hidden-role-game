export { ClocktowerAction } from "./types";
import type { GameAction } from "@/lib/types";
import { ClocktowerAction } from "./types";
import { setNightTargetAction } from "./set-night-target";
import { confirmNightTargetAction } from "./confirm-night-target";
import { provideInformationAction } from "./provide-information";
import { resolveNightAction } from "./resolve-night";
import { advanceNightStepAction } from "./advance-night-step";

export const CLOCKTOWER_ACTIONS: Record<ClocktowerAction, GameAction> = {
  [ClocktowerAction.AdvanceNightStep]: advanceNightStepAction,
  [ClocktowerAction.ConfirmNightTarget]: confirmNightTargetAction,
  [ClocktowerAction.ProvideInformation]: provideInformationAction,
  [ClocktowerAction.ResolveNight]: resolveNightAction,
  [ClocktowerAction.SetNightTarget]: setNightTargetAction,
};
