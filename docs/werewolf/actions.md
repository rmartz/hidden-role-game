---
type: Actions
title: Werewolf — Actions
description: Narrator and player actions, payloads, and validation rules.
gameMode: werewolf
resource: src/lib/game/modes/werewolf/actions
tags: [werewolf, actions, night-phase]
---

# Werewolf — Actions

Actions are the mechanism by which the Narrator and players mutate game state. Each action has an `isValid` guard and an `apply` mutation.

## Action Reference

### `alpha-wolf-bite`

**Who:** Narrator only
**When:** During Nighttime (any turn), while the Alpha Wolf is alive and `alphaWolfBiteUsed` is not set
**Effect:** Converts a living non-werewolf-team player to the Werewolf team by writing an entry to `roleOverrides` in turn state (maps target `playerId → WerewolfRole.Werewolf`). Sets `alphaWolfBiteUsed: true` to prevent reuse. The conversion is reflected immediately in win-condition checks (via `resolveRoleId`) and is visible to all werewolf-team players in their game state (`roleConversions`). Cannot target the narrator/owner, dead players, or players already on Team Bad / flagged `isWerewolf`.

**Payload:** `{ targetPlayerId: string }`

---

### `start-night`

**Who:** Narrator only
**When:** During Daytime
**Effect:** Advances to the next turn and transitions to Nighttime. Builds the `nightPhaseOrder` for the new turn. If the Wolf Cub was killed during the previous night or day, an extra Werewolf phase is appended to `nightPhaseOrder`. If the new turn is turn 3 and `villageDrunkSoberRoleId` is configured, the Village Drunk's role is overridden via `roleOverrides` before `nightPhaseOrder` is built, so their new role's night phase (if any) is included.

---

### `start-day`

**Who:** Narrator only
**When:** During Nighttime
**Effect:** Resolves all night actions, adds killed players to `deadPlayerIds`, and transitions to Daytime. Stores the `nightResolution` events in the new daytime phase for day-start display. If the Tanner is among the killed players, the game ends immediately with a Tanner win.

Additional resolution steps:

- **Vigilante self-death:** If the Vigilante's target is a Good-team player and was killed, the Vigilante also dies.
- **Hunter revenge detection:** If a killed player is the Hunter, sets `hunterRevengePlayerId` on the Narrator's state and defers the win-condition check until revenge is resolved.
- **Monarch updates:** Applies the Monarch's dynamic night protection, records newly knighted players (`monarchKnightedPlayerIds`), and increments `monarchKnightingsUsed` (max 3).
- **Illusion Artist:** If the Illusion Artist confirmed a target this night, stores `roleState.illusionArtist.illusionTargetId` on the new daytime turn state. This is night-specific and not carried forward to the next night.
- **Evil Empath death trigger:** If the Evil Empath was killed this night and `roleState.evilEmpath.lastResult` is set, populates `roleState.evilEmpath.revealedResult` on the turn state so Werewolves see the result.
- **Evil Empath carry-forward:** `roleState.evilEmpath.lastResult` and `roleState.evilEmpath.revealedResult` are preserved across the day/night boundary.
- **Arsonist douse/ignite:** If the Arsonist targeted another player, that player is added to `arsonistDousedPlayerIds` in the new turn state. If the Arsonist self-targeted (ignite), all players in the existing `arsonistDousedPlayerIds` are simultaneously attacked (protections apply to each independently), and the doused list is reset to empty. Dead players are removed from the doused list during this step.

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

- **Solo roles** (Seer, Bodyguard, Witch, etc.): stores `{ targetPlayerId }` under the role's phase key. Passing `targetPlayerId: null` records an intentional skip (`{ skipped: true }`); passing `undefined` clears the selection. Passing `alerted: true` (Veteran only) stores `{ alerted: true }` indicating the Veteran has gone on Alert with no target. The Veteran may only alert up to 3 times per game; further alert attempts are rejected.
- **Group phases** (Werewolves): upserts the caller's vote in `votes[]`. Passing `null` records a skip vote; passing `undefined` removes the vote. The Narrator override sets all alive participants' votes at once and also sets `suggestedTargetId`.

**Payload:** `{ roleId?: string; targetPlayerId?: string | null; alerted?: boolean }`

**Validation:**

- Turn must be > 1.
- Target must exist, not be dead, not be the game owner.
- Attack/Investigate roles cannot target themselves.
- Group phase players cannot target visible teammates; Narrator cannot target group members.
- Roles with `preventRepeatTarget` (Bodyguard, Spellcaster) cannot target the same player as they targeted the previous night (`lastTargets` in `WerewolfTurnState`).
- In a suffixed repeat group phase (e.g., `"werewolf-werewolf:2"`), the target cannot match the `suggestedTargetId` from the base phase's action (within-night exclusion).
- Cannot change a confirmed target (players only; Narrator can override).
- Monarch cannot target already-knighted players and cannot target after 3 knightings are used.
- Roles with `adjacentTargetOnly` (The Thing) may only target immediate seating neighbours. The narrator is excluded from `playerOrder` before computing adjacency, so a player seated next to the narrator always has two selectable neighbours.

---

### `confirm-night-target`

**Who:** Active player (group and solo phases); Narrator (solo phases only, for no-device players)
**When:** During Nighttime, turn 2+
**Effect:** Locks in the player's selected target.

- **Solo phases:** sets `confirmed: true` on the role's night action. Allowed even when no target is set (intentional skip).
- **Group phases:** requires all alive phase participants to have voted for the same target (or all skipped) before confirming. Once confirmed, no player can change their vote.

---

### `reveal-investigation-result`

**Who:** Narrator only
**When:** During Nighttime, when either:

- The active phase is an Investigate role (Seer, Wizard, One-Eyed Seer, Mystic Seer, Mentalist) and the action is confirmed, **or**
- The active phase is the Illuminati (a `revealsFullRoleList` role) and the result has not yet been revealed (no target confirmation required)

**Effect:** Sets `resultRevealed: true` on the night action. For Investigate roles, this causes the player state extraction to include `investigationResult` in the investigating player's `WerewolfPlayerGameState`. For the Illuminati, it causes all `roleAssignments` to be included as `illuminatiRoleAssignments` in the Illuminati player's state.

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
**Effect:** Starts a trial against a defendant. Pre-populates forced votes (Village Idiot = guilty, Pacifist = innocent). Clears nominations. Blocked when `concludedTrialsCount >= trialsPerDay` (and `trialsPerDay > 0`).

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
**Effect:** Resolves the trial verdict — guilty votes exceeding innocent votes results in elimination. The Mayor's vote counts double, and each living Monarch-knighted voter contributes +1 extra vote. Clears One-Eyed Seer lock and Priest wards for a killed player.

On a Guilty verdict, instead of immediately eliminating the player, sets `pendingGuiltId` on the daytime phase and enters the Martyr window. Win-condition checks are deferred until the window is resolved.

---

### `advance-martyr-window`

**Who:** Narrator only
**When:** During Daytime, when `pendingGuiltId` is set (Guilty verdict pending)
**Effect:** Applies the pending conviction — adds the convicted player to `deadPlayerIds`, clears One-Eyed Seer lock and Priest wards for the eliminated player, then checks the Executioner win, Tanner win, Hunter revenge, and general win conditions in that order. Clears `pendingGuiltId`.

The Martyr window is always inserted after a Guilty verdict, even when no Martyr is in the game, to build drama before the role reveal.

---

### `use-martyr-ability`

**Who:** Martyr player, or Narrator (narrator-first: no-device Martyr support)
**When:** During Daytime, when `pendingGuiltId` is set (Guilty verdict pending)
**Effect:** The Martyr intercepts the conviction — the convicted player is spared, and the Martyr dies instead. Checks win condition after the Martyr's death. Sets `martyrUsed: true` (once-per-game ability).

**Payload:** none — the Martyr is unique, so the action resolves the Martyr's identity automatically by scanning `roleAssignments`.

**Validation:**

- Caller must be the Martyr player, or the Narrator (narrator-first bypass for no-device tables). The Martyr must be alive.
- `pendingGuiltId` must be set.
- `martyrUsed` must be `false`.
- The Martyr cannot use this ability to save themselves (`pendingGuiltId !== martyrId`).

---

### `end-game`

**Who:** Narrator only
**When:** Any
**Effect:** Ends the game immediately.

---

### `smite-player`

**Who:** Narrator only
**When:** During Nighttime or Daytime
**Effect:** During nighttime, marks a player for death at start of day (bypasses all protections). During daytime, marks a player to be eliminated at the end of the next night.

**Payload:** `{ playerId: string }`

---

### `unsmite-player`

**Who:** Narrator only
**When:** During Nighttime or Daytime
**Effect:** Removes a pending smite from a player.

**Payload:** `{ playerId: string }`

---

### `nominate-player`

**Who:** Player
**When:** During Daytime
**Effect:** Nominates a defendant for trial. When the nomination count reaches the threshold, a trial is automatically started. Blocked when `concludedTrialsCount >= trialsPerDay` (and `trialsPerDay > 0`).

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
**Effect:** Immediately kills a player (for in-person trials). Checks win condition. Clears One-Eyed Seer lock and Priest wards for the killed player. If the killed player is the Evil Empath and `roleState.evilEmpath.lastResult` is recorded, sets `roleState.evilEmpath.revealedResult` so Werewolves see the result.

**Payload:** `{ playerId: string }`

---

### `set-illusion-target`

**Who:** Illusion Artist player only
**When:** During Nighttime, during the Illusion Artist's phase, turn 2+
**Effect:** Stores the target in `nightActions[IllusionArtist].targetPlayerId`. When the Seer investigates that target during the same night, the investigation result is inverted. The `illusionTargetId` is carried into the daytime turn state so the Seer's result display sees the correct (inverted) value. Not carried into the next night.

**Payload:** `{ targetPlayerId: string }`

**Validation:**

- Caller must be the Illusion Artist.
- Active night phase must be `IllusionArtist`.
- Target must be alive and not the caller.
- Target cannot be the same player targeted the previous night (`preventRepeatTarget` via `lastTargets`).

---

### `confirm-evil-empath-result`

**Who:** Narrator only
**When:** During Nighttime, during the Evil Empath's phase
**Effect:** Auto-computes whether the Seer is seated adjacent (circular seating order in `game.playerOrder`) to any living player with `roleDef.isWerewolf === true`. Stores the boolean result in `roleState.evilEmpath.lastResult` on the turn state, marks the Evil Empath's night action as `confirmed` and `resultRevealed`. The result is surfaced to the Evil Empath player as `evilEmpathNightResult` in their player state (only while the action is confirmed, to prevent showing a stale result at the start of a new night). When the Evil Empath dies (night via `start-day`, or day via `kill-player`, `advance-martyr-window`, `resolve-hunter-revenge`), `roleState.evilEmpath.revealedResult` is set on the turn state so Werewolves see it in their group phase state.

**Payload:** none

---

### `submit-ghost-clue`

**Who:** Ghost player only (dead player with Ghost role)
**When:** During Daytime
**Effect:** Records a clue from the Ghost player into `WerewolfTurnState.roleState.ghost.clues`. The clue is visible to all living players for the rest of the game.

**Payload:** `{ clue: string }`

**Validation:**

- Caller must be dead.
- Caller must have the Ghost role.
- Game must be in Daytime phase.
- Clue must be a non-empty string of at most 20 characters.
- Caller may only submit one clue per turn.

---

### `pause-timer`

**Who:** Narrator only
**When:** During Nighttime or Daytime, while a timer is running (not already paused). When a Daytime active trial is in progress (no verdict yet), targets the **trial timer** instead of the phase timer.
**Effect:** Freezes the active timer by recording the current time in `pausedAt`. The elapsed-time formula switches to `pauseOffset + (pausedAt - startedAt)` (defense phase) or `pauseOffset + (pausedAt - voteStartedAt)` (voting phase) until the timer is resumed.

**Payload:** `{}` (no payload)

**Validation:**

- Phase must exist; narrator only.
- If a Daytime active trial (no verdict): `activeTrial.pausedAt` must not already be set.
- Otherwise: `phase.pausedAt` must not already be set.

**Fields mutated:**

- With active trial: `activeTrial.pausedAt`
- Without active trial: `phase.pausedAt`

---

### `resume-timer`

**Who:** Narrator only
**When:** During Nighttime or Daytime, while the timer is paused (`pausedAt` is set). When a Daytime active trial is in progress (no verdict yet), targets the **trial timer** instead of the phase timer.
**Effect:** Resumes the active timer by accumulating the paused interval into `pauseOffset`, resetting the relevant start timestamp to now, and clearing `pausedAt`. During the trial voting phase, `voteStartedAt` is shifted forward instead of `startedAt`.

**Payload:** `{}` (no payload)

**Validation:**

- Phase must exist; narrator only.
- If a Daytime active trial (no verdict): `activeTrial.pausedAt` must be set.
- Otherwise: `phase.pausedAt` must be set.

**Fields mutated:**

- With active trial (defense phase): `activeTrial.pauseOffset`, `activeTrial.startedAt`, `activeTrial.pausedAt` (cleared)
- With active trial (voting phase): `activeTrial.pauseOffset`, `activeTrial.voteStartedAt`, `activeTrial.pausedAt` (cleared)
- Without active trial: `phase.pauseOffset`, `phase.startedAt`, `phase.pausedAt` (cleared)

---

## Action Payload Summary

| Action                        | Caller                                       | Payload                                                                   |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `start-night`                 | Narrator                                     | none                                                                      |
| `start-day`                   | Narrator                                     | none                                                                      |
| `set-night-phase`             | Narrator                                     | `{ phaseIndex: number }`                                                  |
| `set-night-target`            | Narrator or active player                    | `{ roleId?: string; targetPlayerId?: string \| null; alerted?: boolean }` |
| `confirm-night-target`        | Active player or Narrator (solo phases only) | none                                                                      |
| `reveal-investigation-result` | Narrator                                     | none                                                                      |
| `mark-player-dead`            | Narrator                                     | `{ playerId: string }`                                                    |
| `mark-player-alive`           | Narrator                                     | `{ playerId: string }`                                                    |
| `start-trial`                 | Narrator                                     | `{ defendantId: string }`                                                 |
| `cast-vote`                   | Player                                       | `{ vote: "guilty" \| "innocent" }`                                        |
| `resolve-hunter-revenge`      | Narrator                                     | `{ targetPlayerId: string }`                                              |
| `resolve-trial`               | Narrator                                     | none                                                                      |
| `advance-martyr-window`       | Narrator                                     | none                                                                      |
| `use-martyr-ability`          | Martyr player or Narrator                    | none                                                                      |
| `end-game`                    | Narrator                                     | none                                                                      |
| `smite-player`                | Narrator                                     | `{ playerId: string }`                                                    |
| `unsmite-player`              | Narrator                                     | `{ playerId: string }`                                                    |
| `nominate-player`             | Player                                       | `{ defendantId: string }`                                                 |
| `withdraw-nomination`         | Player                                       | none                                                                      |
| `skip-defense`                | Narrator                                     | none                                                                      |
| `kill-player`                 | Narrator                                     | `{ playerId: string }`                                                    |
| `set-illusion-target`         | Illusion Artist player                       | `{ targetPlayerId: string }`                                              |
| `confirm-evil-empath-result`  | Narrator                                     | none                                                                      |
| `submit-ghost-clue`           | Ghost (dead player)                          | `{ clue: string }`                                                        |
| `pause-timer`                 | Narrator                                     | none                                                                      |
| `resume-timer`                | Narrator                                     | none                                                                      |

Night action state types, night resolution, trial resolution, and win-condition evaluation are documented in [Werewolf — Resolution](resolution.md).
