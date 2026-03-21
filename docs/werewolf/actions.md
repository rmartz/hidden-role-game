# Werewolf — Actions

Actions are the mechanism by which the Narrator and players mutate game state. Each action has an `isValid` guard and an `apply` mutation.

## Action Reference

### `start-night`

**Who:** Narrator only
**When:** During Daytime
**Effect:** Advances to the next turn and transitions to Nighttime. Builds the `nightPhaseOrder` for the new turn. If the Wolf Cub was killed during the previous night or day, an extra Werewolf phase is appended to `nightPhaseOrder`.

---

### `start-day`

**Who:** Narrator only
**When:** During Nighttime
**Effect:** Resolves all night actions, adds killed players to `deadPlayerIds`, and transitions to Daytime. Stores the `nightResolution` events in the new daytime phase for day-start display.

Additional resolution steps:

- **Vigilante self-death:** If the Vigilante's target is a Good-team player and was killed, the Vigilante also dies.
- **Hunter revenge detection:** If a killed player is the Hunter, sets `hunterRevengePlayerId` on the Narrator's state and defers the win-condition check until revenge is resolved.

---

### `set-night-phase`

**Who:** Narrator only
**When:** During Nighttime
**Effect:** Advances (or jumps) to the given `phaseIndex` in `nightPhaseOrder`. Resets `startedAt` for the new phase. Used to step through each role's wake turn.

**Payload:** `{ phaseIndex: number }`

---

### `set-night-target`

**Who:** Narrator (explicit `roleId`) or active player (inferred from role)
**When:** During Nighttime, turn 2+
**Effect:** Sets or clears a night target.

- **Solo roles** (Seer, Bodyguard, Witch, etc.): stores `{ targetPlayerId }` under the role's phase key. Passing `targetPlayerId: null` records an intentional skip (`{ skipped: true }`); passing `undefined` clears the selection.
- **Group phases** (Werewolves): upserts the caller's vote in `votes[]`. Passing `null` records a skip vote; passing `undefined` removes the vote. The Narrator override sets all alive participants' votes at once and also sets `suggestedTargetId`.

**Payload:** `{ roleId?: string; targetPlayerId?: string | null }`

**Validation:**

- Turn must be > 1.
- Target must exist, not be dead, not be the game owner.
- Attack/Investigate roles cannot target themselves.
- Group phase players cannot target visible teammates; Narrator cannot target group members.
- Roles with `preventRepeatTarget` (Bodyguard, Spellcaster) cannot target the same player as they targeted the previous night (`lastTargets` in `WerewolfTurnState`).
- In a suffixed repeat group phase (e.g., `"werewolf-werewolf:2"`), the target cannot match the `suggestedTargetId` from the base phase's action (within-night exclusion).
- Cannot change a confirmed target (players only; Narrator can override).

---

### `confirm-night-target`

**Who:** Active player
**When:** During Nighttime, turn 2+
**Effect:** Locks in the player's selected target.

- **Solo phases:** sets `confirmed: true` on the role's night action. Allowed even when no target is set (intentional skip).
- **Group phases:** requires all alive phase participants to have voted for the same target (or all skipped) before confirming. Once confirmed, no player can change their vote.

---

### `reveal-investigation-result`

**Who:** Narrator only
**When:** During Nighttime, active phase is an Investigate role (Seer, Wizard, One-Eyed Seer, Mystic Seer, Mentalist), action is confirmed
**Effect:** Sets `resultRevealed: true` on the night action. This causes `GameSerializationService` to include the `investigationResult` in the investigating player's `PlayerGameState`.

---

### `mark-player-dead`

**Who:** Narrator only
**When:** Any
**Effect:** Adds the player to `deadPlayerIds`. If the player is the Wolf Cub, sets `wolfCubDied: true` on turn state.

---

### `mark-player-alive`

**Who:** Narrator only
**When:** Any
**Effect:** Removes the player from `deadPlayerIds`.

---

### `start-trial`

**Who:** Narrator only
**When:** During Daytime
**Effect:** Starts a trial against a defendant. Pre-populates forced votes (Village Idiot = guilty, Pacifist = innocent). Clears nominations. Blocked by `singleTrialPerDay` if a trial has already concluded this day.

**Payload:** `{ defendantId: string }`

---

### `cast-vote`

**Who:** Player
**When:** During Daytime (voting phase of an active trial)
**Effect:** Casts a guilty or innocent vote. Silenced and dead players cannot vote. Hypnotized players' votes mirror the Mummy's vote.

**Payload:** `{ vote: "guilty" | "innocent" }`

---

### `resolve-hunter-revenge`

**Who:** Narrator only
**When:** During Daytime, when `hunterRevengePlayerId` is set
**Effect:** Selects the Hunter's revenge target. Kills the target (unblockable), clears `hunterRevengePlayerId`, and checks the win condition.

**Payload:** `{ targetPlayerId: string }`

---

### `resolve-trial`

**Who:** Narrator only
**When:** During Daytime (after voting completes)
**Effect:** Resolves the trial verdict — guilty votes exceeding innocent votes results in elimination. The Mayor's vote counts double. Clears One-Eyed Seer lock and Priest wards for a killed player.

- **Hunter revenge detection:** If the condemned player is the Hunter, sets `hunterRevengePlayerId` on the Narrator's state and defers the win-condition check until revenge is resolved.

---

### `end-game`

**Who:** Narrator only
**When:** Any
**Effect:** Ends the game immediately.

---

### `smite-player`

**Who:** Narrator only
**When:** During Nighttime
**Effect:** Marks a player for death by mysterious forces. Smite bypasses all protections (Bodyguard, Doctor, Priest ward, Witch).

**Payload:** `{ playerId: string }`

---

### `unsmite-player`

**Who:** Narrator only
**When:** During Nighttime
**Effect:** Removes a pending smite from a player.

**Payload:** `{ playerId: string }`

---

### `nominate-player`

**Who:** Player
**When:** During Daytime
**Effect:** Nominates a defendant for trial. When the nomination count reaches the threshold, a trial is automatically started. Blocked by `singleTrialPerDay` if a trial has already concluded this day.

**Payload:** `{ defendantId: string }`

---

### `withdraw-nomination`

**Who:** Player
**When:** During Daytime
**Effect:** Withdraws the player's own nomination.

---

### `skip-defense`

**Who:** Narrator only
**When:** During Daytime (defense phase of an active trial)
**Effect:** Skips the defense phase and moves the trial directly to voting.

---

### `kill-player`

**Who:** Narrator only
**When:** During Daytime
**Effect:** Immediately kills a player (for in-person trials). Checks win condition. Clears One-Eyed Seer lock and Priest wards for the killed player.

**Payload:** `{ playerId: string }`

---

## Action Payload Summary

| Action                        | Caller                    | Payload                                                |
| ----------------------------- | ------------------------- | ------------------------------------------------------ |
| `start-night`                 | Narrator                  | none                                                   |
| `start-day`                   | Narrator                  | none                                                   |
| `set-night-phase`             | Narrator                  | `{ phaseIndex: number }`                               |
| `set-night-target`            | Narrator or active player | `{ roleId?: string; targetPlayerId?: string \| null }` |
| `confirm-night-target`        | Active player             | none                                                   |
| `reveal-investigation-result` | Narrator                  | none                                                   |
| `mark-player-dead`            | Narrator                  | `{ playerId: string }`                                 |
| `mark-player-alive`           | Narrator                  | `{ playerId: string }`                                 |
| `start-trial`                 | Narrator                  | `{ defendantId: string }`                              |
| `cast-vote`                   | Player                    | `{ vote: "guilty" \| "innocent" }`                     |
| `resolve-hunter-revenge`      | Narrator                  | `{ targetPlayerId: string }`                           |
| `resolve-trial`               | Narrator                  | none                                                   |
| `end-game`                    | Narrator                  | none                                                   |
| `smite-player`                | Narrator                  | `{ playerId: string }`                                 |
| `unsmite-player`              | Narrator                  | `{ playerId: string }`                                 |
| `nominate-player`             | Player                    | `{ defendantId: string }`                              |
| `withdraw-nomination`         | Player                    | none                                                   |
| `skip-defense`                | Narrator                  | none                                                   |
| `kill-player`                 | Narrator                  | `{ playerId: string }`                                 |

## Night Action Types

```typescript
// Solo role action (Seer, Bodyguard, Witch, Spellcaster, Chupacabra, Doctor, Priest, Mummy, Wizard, One-Eyed Seer, Exposer, Mystic Seer, Altruist, Mortician)
interface NightAction {
  targetPlayerId?: string; // absent when skipped
  skipped?: true; // set when the player intentionally chose "Skip"
  confirmed?: boolean;
  resultRevealed?: boolean; // Seer, Wizard, One-Eyed Seer, Mystic Seer
  secondTargetPlayerId?: string; // Mentalist dual-target
}

// Individual vote within a group phase
interface TeamNightVote {
  playerId: string;
  targetPlayerId?: string; // absent when skipped
  skipped?: true; // set when this player intentionally voted "Skip"
}

// Group phase action (Werewolves)
interface TeamNightAction {
  votes: TeamNightVote[];
  suggestedTargetId?: string; // plurality vote target; absent if tie or all skipped
  confirmed?: boolean;
}
```

## Night Resolution

`resolveNightActions()` runs when `start-day` is called:

1. Collects base attacks and protections from all roles except Witch, Altruist, Spellcaster, and Mummy.
2. Applies Priest ward protection: any player with an active ward has the ward consume the attack (ward is removed, player survives).
3. Applies Witch action: if target is already under attack → protect; otherwise → attack.
4. Applies Altruist action (last): if the Altruist's target is under attack, the attack is redirected onto the Altruist (the Altruist dies instead).
5. Applies Tough Guy absorption: if a Tough Guy is attacked for the first time, the attack is absorbed (survives this night, dies on the next attack).
6. Applies Smite: any smited player is killed regardless of protections.
7. Applies Spellcaster action: emits a `silenced` event.
8. Applies Mummy action: emits a `hypnotized` event for the target.
9. Checks Old Man timer (`oldManTimerPlayerId` option): if the timer has reached zero **and** the Old Man was not attacked this night, emits a `"peaceful"` killed event and adds the Old Man to `deadPlayerIds`.
10. Resolves Mortician attack: if the Mortician's target died, the Mortician learns their role; if the target was protected, the Mortician receives "not a Werewolf" regardless of the target's actual team.
11. Returns `NightResolutionEvent[]`:

- `{ type: "killed", targetPlayerId, attackedBy, protectedBy, died }`
- `{ type: "silenced", targetPlayerId }`
- `{ type: "hypnotized", targetPlayerId }`
- `{ type: "tough-guy-absorbed", targetPlayerId }`
- `{ type: "altruist-intercepted", targetPlayerId }`
- `{ type: "killed", targetPlayerId, effect: "peaceful" }` (Old Man timer)

```mermaid
flowchart TD
    Start([start-day called]) --> Collect[Collect attacks and protections\nfrom Werewolves, Bodyguard, Doctor, Chupacabra]
    Collect --> Priest{Priest ward active\non target?}
    Priest -->|yes| WardAbsorb[Ward absorbs attack\nremove ward]
    Priest -->|no| Witch
    WardAbsorb --> Witch
    Witch{Witch used ability?}
    Witch -->|protect target| Protect[Remove pending attack on target]
    Witch -->|attack target| NewAttack[Add new attack on target]
    Witch -->|skipped| Altruist
    Protect --> Altruist
    NewAttack --> Altruist
    Altruist{Altruist target\nunder attack?}
    Altruist -->|yes| Intercept[Redirect attack onto Altruist\nemit altruist-intercepted]
    Altruist -->|no| ToughGuy
    Intercept --> ToughGuy
    ToughGuy{Tough Guy attacked\nfor first time?}
    ToughGuy -->|yes| Absorb[Absorb attack\nemit tough-guy-absorbed]
    ToughGuy -->|no| Smite
    Absorb --> Smite
    Smite{Player smited?}
    Smite -->|yes| ForceDeath[Force death regardless\nof protections]
    Smite -->|no| Spellcaster
    ForceDeath --> Spellcaster
    Spellcaster{Spellcaster acted?}
    Spellcaster -->|yes| Silence[Emit silenced event for target]
    Spellcaster -->|no| Mummy
    Silence --> Mummy
    Mummy{Mummy acted?}
    Mummy -->|yes| Hypnotize[Emit hypnotized event for target]
    Mummy -->|no| Resolve
    Hypnotize --> Resolve
    Resolve[For each collected attack:\nif protected → died = false\nelse → died = true\nemit killed event]
    Resolve --> OldMan{Old Man timer expired?}
    OldMan -->|yes, not attacked| Peaceful[Emit peaceful killed event\nfor Old Man]
    OldMan -->|no or attacked| Mortician
    Peaceful --> Mortician
    Mortician{Mortician attacked?}
    Mortician -->|target died| LearnRole[Mortician learns target role]
    Mortician -->|target protected| FalseResult[Mortician receives\n'not a Werewolf']
    Mortician -->|skipped| Return
    LearnRole --> Return
    FalseResult --> Return
    Return([Return NightResolutionEvent array])
```
