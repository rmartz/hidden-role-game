import { GameMode } from "@/lib/types";
import { GAME_MODES } from "@/lib/game/modes";
import { RoleGlossaryDialog } from "@/components/game";
import {
  WEREWOLF_ROLE_CATEGORY_LABELS,
  WEREWOLF_ROLE_CATEGORY_ORDER,
} from "@/lib/game/modes/werewolf/roles";
import { WEREWOLF_COPY } from "@/lib/game/modes/werewolf/copy";

const werewolfAllRoles = Object.values(GAME_MODES[GameMode.Werewolf].roles);

export function WerewolfLobbyGlossary() {
  return (
    <RoleGlossaryDialog
      roles={werewolfAllRoles}
      gameMode={GameMode.Werewolf}
      title={WEREWOLF_COPY.glossary.dialogTitle}
      triggerLabel={WEREWOLF_COPY.glossary.openButton}
      categoryOrder={WEREWOLF_ROLE_CATEGORY_ORDER}
      categoryLabels={WEREWOLF_ROLE_CATEGORY_LABELS}
    />
  );
}
