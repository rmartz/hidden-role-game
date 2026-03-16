# Werewolf — Roles

## Overview

Each player is secretly assigned one role. The Narrator has no role and runs the game.

## Role Table

| Role          | ID                       | Team    | Wakes at Night     | Night Action         | Notes                                                                                                       |
| ------------- | ------------------------ | ------- | ------------------ | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Villager      | `werewolf-villager`      | Good    | Never              | —                    | Baseline good-team role                                                                                     |
| Werewolf      | `werewolf-werewolf`      | Bad     | Every Night        | Attack (team vote)   | Sees all Bad-team players; votes jointly with other Werewolves                                              |
| Seer          | `werewolf-seer`          | Good    | Every Night        | Investigate          | Learns whether the target is on Team Bad; Narrator reveals result                                           |
| Bodyguard     | `werewolf-bodyguard`     | Good    | Every Night        | Protect              | Chosen target survives any attack that night                                                                |
| Witch         | `werewolf-witch`         | Good    | Every Night (last) | Special (once)       | After all other roles act, may protect the attacked player **or** attack any other player; one-time ability |
| Spellcaster   | `werewolf-spellcaster`   | Good    | Every Night        | Silence              | Target is silenced the following day (visible to all players)                                               |
| Mason         | `werewolf-mason`         | Good    | First Night Only   | —                    | Masons see each other's identities; no action after night 1                                                 |
| Chupacabra    | `werewolf-chupacabra`    | Neutral | Every Night        | Attack (conditional) | Attack lands only if target is on Team Bad, **or** if all Team Bad players are already dead                 |
| Village Idiot | `werewolf-village-idiot` | Good    | Never              | —                    | Baseline good-team role                                                                                     |

## Role Properties

```typescript
interface WerewolfRoleDefinition {
  id: WerewolfRole;
  name: string;
  team: Team; // Good | Bad | Neutral
  wakesAtNight: WakesAtNight; // Never | FirstNightOnly | EveryNight
  targetCategory: TargetCategory; // None | Attack | Protect | Investigate | Special
  canSeeTeam?: Team[]; // Teams whose members this role can see
  canSeeRole?: WerewolfRole[]; // Specific roles this role can identify
  teamTargeting?: boolean; // True = group phase (Werewolves vote together)
  wakesWith?: WerewolfRole; // Secondary role that joins another role's phase
}
```

## Night Phase Ordering

Roles wake in the order they are defined in `WEREWOLF_ROLES`, subject to these rules:

1. Roles with `wakesAtNight: Never` are always skipped.
2. Roles with `wakesAtNight: FirstNightOnly` are skipped on turn 2+.
3. A role is skipped if all players assigned to it are dead.
4. Roles with `wakesWith` do not get their own phase — they participate in the primary role's phase.
5. The Witch always acts **last**, after all other roles, so she can see current attacks before deciding.

## Default Role Distribution

The Narrator does not receive a role. For `n` total players:

| Role     | Count         |
| -------- | ------------- |
| Werewolf | `⌊(n−1) / 3⌋` |
| Seer     | 1             |
| Villager | remaining     |

Additional roles (Bodyguard, Witch, etc.) are configured per game in the lobby.

## Visibility Rules

- **Werewolves** see all other Team Bad players (`canSeeTeam: [Team.Bad]`).
- **Masons** see all other Masons (`canSeeRole: [Mason]`).
- **Dead players** have their roles revealed to all living players automatically.
- All other roles see only their own identity.
