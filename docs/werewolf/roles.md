# Werewolf — Roles

## Overview

Each player is secretly assigned one role. The Narrator has no role and runs the game.

## Role Table

| Role          | ID                       | Team    | Wakes at Night            | Night Action         | Notes                                                                                                                                                                                                                    |
| ------------- | ------------------------ | ------- | ------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Villager      | `werewolf-villager`      | Good    | Never                     | —                    | Baseline good-team role                                                                                                                                                                                                  |
| Werewolf      | `werewolf-werewolf`      | Bad     | Every Night               | Attack (group vote)  | Sees all Bad-team players; votes jointly with other Werewolves and Wolf Cubs; `teamTargeting`, `isWerewolf`                                                                                                              |
| Wolf Cub      | `werewolf-wolf-cub`      | Bad     | Every Night               | Attack (group vote)  | Wakes with Werewolves (`wakesWith`); when killed, Werewolves receive two attack phases the following night; `isWerewolf`                                                                                                 |
| Seer          | `werewolf-seer`          | Good    | Every Night               | Investigate          | Learns whether the target is on Team Bad; Narrator reveals result                                                                                                                                                        |
| Witch         | `werewolf-witch`         | Good    | Every Night (2nd-to-last) | Special (once)       | After all other roles act (except Altruist), may protect the attacked player **or** attack any other player; one-time ability                                                                                            |
| Spellcaster   | `werewolf-spellcaster`   | Good    | Every Night               | Special (silence)    | Target is silenced the following day; cannot silence the same player on consecutive nights (`preventRepeatTarget`)                                                                                                       |
| Mason         | `werewolf-mason`         | Good    | First Night Only          | —                    | Masons see each other's identities (`awareOf: Masons`); no action after night 1                                                                                                                                          |
| Chupacabra    | `werewolf-chupacabra`    | Neutral | Every Night               | Attack (conditional) | Attack lands only if target is on Team Bad, **or** if all Team Bad players are already dead                                                                                                                              |
| Hunter        | `werewolf-hunter`        | Good    | Never                     | —                    | When killed (night or trial), triggers revenge — Narrator selects a target to kill. Revenge kill is unblockable. Win condition deferred until revenge resolved.                                                          |
| Vigilante     | `werewolf-vigilante`     | Good    | After First Night         | Attack               | Kills one player per night starting night 2. If target is Good-team and dies, Vigilante also dies. `preventSelfTarget`.                                                                                                  |
| Village Idiot | `werewolf-village-idiot` | Good    | Never                     | —                    | Vote is forced to guilty during trials (`alwaysVotesGuilty`)                                                                                                                                                             |
| Bodyguard     | `werewolf-bodyguard`     | Good    | Every Night               | Protect              | Chosen target survives any attack that night; cannot protect the same player on consecutive nights (`preventRepeatTarget`)                                                                                               |
| Doctor        | `werewolf-doctor`        | Good    | Every Night               | Protect              | Chosen target survives any attack that night; cannot protect self (`preventSelfTarget`)                                                                                                                                  |
| Priest        | `werewolf-priest`        | Good    | Every Night               | Protect              | Places a persistent ward on the target; ward absorbs the next attack on that player                                                                                                                                      |
| Tough Guy     | `werewolf-tough-guy`     | Good    | Never                     | —                    | Survives the first attack; dies to a subsequent attack                                                                                                                                                                   |
| Minion        | `werewolf-minion`        | Bad     | First Night Only          | —                    | Sees all werewolf players (`awareOf: werewolves`); werewolves do not know the Minion's identity                                                                                                                          |
| Pacifist      | `werewolf-pacifist`      | Good    | Never                     | —                    | Vote is forced to innocent during trials (`alwaysVotesInnocent`)                                                                                                                                                         |
| Mayor         | `werewolf-mayor`         | Good    | Never                     | —                    | Vote counts double during trials (secret — not revealed to other players)                                                                                                                                                |
| Mummy         | `werewolf-mummy`         | Good    | Every Night               | Special (hypnotize)  | Hypnotizes target's vote the following day — their vote mirrors the Mummy's vote                                                                                                                                         |
| Wizard        | `werewolf-wizard`        | Bad     | Every Night               | Investigate          | Checks whether the target is the Seer (`checksForSeer`)                                                                                                                                                                  |
| One-Eyed Seer | `werewolf-one-eyed-seer` | Good    | Every Night               | Investigate          | Learns whether target is on Team Bad; if a werewolf is detected, locks onto that player for future nights                                                                                                                |
| Exposer       | `werewolf-exposer`       | Good    | Every Night               | Special (reveal)     | Reveals target's role publicly; one-time ability (`oncePerGame`)                                                                                                                                                         |
| Elusive Seer  | `werewolf-elusive-seer`  | Good    | First Night Only          | —                    | Sees all Villager-role players on the first night                                                                                                                                                                        |
| Mentalist     | `werewolf-mentalist`     | Good    | Every Night               | Investigate (dual)   | Selects two players and learns whether they are on the same team (`dualTargetInvestigate`)                                                                                                                               |
| Mystic Seer   | `werewolf-mystic-seer`   | Good    | Every Night               | Investigate          | Learns the target's exact role, not just their team (`revealsExactRole`)                                                                                                                                                 |
| Altruist      | `werewolf-altruist`      | Good    | Every Night (last)        | Special (intercept)  | Acts after the Witch (last in night order); intercepts an attack on the target and dies in their place                                                                                                                   |
| Mortician     | `werewolf-mortician`     | Good    | Every Night               | Attack               | Kills a target each night and learns their role on success. If target is protected, receives "not a Werewolf" (even if target was a wolf). `preventSelfTarget`.                                                          |
| Old Man       | `werewolf-old-man`       | Good    | Never                     | —                    | Dies peacefully after (#werewolves + 1) nights via a timer. No special protection — wolves kill normally. Peaceful death only if the timer is the sole cause (not attacked same night). `bypassesProtection` is NOT set. |

## Role Properties

```typescript
interface WerewolfRoleDefinition {
  id: WerewolfRole;
  name: string;
  team: Team; // Good | Bad | Neutral
  wakesAtNight: WakesAtNight; // Never | FirstNightOnly | AfterFirstNight | EveryNight
  targetCategory: TargetCategory; // None | Attack | Protect | Investigate | Special
  category?: string; // Display category for role selection UI
  canSeeTeam?: Team[]; // Teams whose members this role can see
  canSeeRole?: WerewolfRole[]; // Specific roles this role can identify
  teamTargeting?: boolean; // True = primary role for a group phase (Werewolves vote together)
  preventRepeatTarget?: boolean; // True = cannot target the same player on consecutive nights (Bodyguard, Spellcaster)
  preventSelfTarget?: boolean; // True = cannot target self (Doctor)
  wakesWith?: WerewolfRole; // Secondary role that silently joins the referenced role's group phase
  isWerewolf?: boolean; // True = counts as a werewolf for investigation and win-condition purposes (Werewolf, Wolf Cub)
  alwaysVotesGuilty?: boolean; // True = vote is forced to guilty during trials (Village Idiot)
  alwaysVotesInnocent?: boolean; // True = vote is forced to innocent during trials (Pacifist)
  checksForSeer?: boolean; // True = investigates whether target is the Seer (Wizard)
  revealsExactRole?: boolean; // True = investigation reveals the exact role, not just team (Mystic Seer)
  dualTargetInvestigate?: boolean; // True = selects two targets and learns if they share a team (Mentalist)
  oncePerGame?: boolean; // True = ability can only be used once (Exposer)
}
```

## Night Phase Ordering

Roles wake in the order they are defined in `WEREWOLF_ROLES`, subject to these rules:

1. Roles with `wakesAtNight: Never` are always skipped.
2. Roles with `wakesAtNight: FirstNightOnly` are skipped on turn 2+.
3. A role is skipped if all players assigned to it are dead.
4. Roles with `wakesWith` do not get their own phase — they participate in the primary role's phase.
5. The Witch acts **second-to-last**, after all other roles except the Altruist, so she can see current attacks before deciding.
6. The Altruist always acts **last**, after the Witch, so it can intercept attacks (including Witch attacks) on its target.

## Default Role Distribution

The Narrator does not receive a role. For `n` total players:

| Role     | Count         |
| -------- | ------------- |
| Werewolf | `⌊(n−1) / 3⌋` |
| Seer     | 1             |
| Villager | remaining     |

Additional roles (Bodyguard, Witch, etc.) are configured per game in the lobby.

## Visibility Rules

- **Werewolves** see all other Team Bad players (`canSeeTeam: [Team.Bad]`), including Wolf Cubs and Minion.
- **Wolf Cubs** see all other Team Bad players (`canSeeTeam: [Team.Bad]`), including Werewolves.
- **Minion** sees all werewolf players (`awareOf: werewolves`) on the first night. Werewolves do **not** see the Minion (the Minion is Team Bad but awareness is one-directional).
- **Masons** see all other Masons (`canSeeRole: [Mason]`).
- **Dead players** have their roles revealed to all living players automatically.
- All other roles see only their own identity.

```mermaid
graph LR
    WW[Werewolf] -->|sees all| Bad[Team Bad players]
    Minion -->|sees all| WWs[Werewolf players]
    Mason -->|sees all| Masons[Other Masons]
    All[All players] -->|see roles of| Dead[Dead players]
    Narrator -->|sees all| Assignments[All role assignments]
```

## Night Phase Ordering Logic

```mermaid
flowchart TD
    Start([For each role in WEREWOLF_ROLES]) --> WakesNever{wakesAtNight = Never?}
    WakesNever -->|Yes| Skip[Skip]
    WakesNever -->|No| FirstNight{wakesAtNight = FirstNightOnly\nAND turn > 1?}
    FirstNight -->|Yes| Skip
    FirstNight -->|No| WakesWith{wakesWith set?}
    WakesWith -->|Yes| SkipOwn[Skip — joins primary phase]
    WakesWith -->|No| Alive{Any alive participants\nor wakesWith participants?}
    Alive -->|No| Skip
    Alive -->|Yes| Add[Add phase key to order]
    Add --> IsWitch{Is Witch?}
    IsWitch -->|Yes| MoveSecondLast[Move to second-to-last]
    IsWitch -->|No| IsAltruist{Is Altruist?}
    IsAltruist -->|Yes| MoveLast[Move to end of order]
    IsAltruist -->|No| Next
    MoveSecondLast --> Next[Next role]
    MoveLast --> Next
    Skip --> Next
    SkipOwn --> Next
    Next --> Done([nightPhaseOrder complete])
```
