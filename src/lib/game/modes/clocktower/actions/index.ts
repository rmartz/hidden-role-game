export { ClocktowerAction } from "./types";
import type { GameAction } from "@/lib/types";
import { ClocktowerAction } from "./types";
import { setNightTargetAction } from "./set-night-target";
import { confirmNightTargetAction } from "./confirm-night-target";
import { provideInformationAction } from "./provide-information";

export const CLOCKTOWER_ACTIONS: Record<ClocktowerAction, GameAction> = {
  [ClocktowerAction.SetNightTarget]: setNightTargetAction,
  [ClocktowerAction.ConfirmNightTarget]: confirmNightTargetAction,
  [ClocktowerAction.ProvideInformation]: provideInformationAction,
};
