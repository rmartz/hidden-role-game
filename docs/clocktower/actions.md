# Clocktower — Actions

Actions are the mechanism by which the Storyteller and players mutate game state. Each action has an `isValid` guard and an `apply` mutation.

## Action Reference

### `nominate-player`

**Who:** Living player
**When:** During the Day phase, before an execution has occurred this day
**Effect:** Nominates another player for execution. Each player may nominate at most once per day. Each player may be nominated at most once per day. If the nominee is the Virgin and a Townsfolk nominator triggers the Virgin's one-time ability, the nominator is immediately executed and the nomination ends without adding an open nomination.

**Payload:** `{ nomineeId: string }`

**Validation:**

- Game must be in Playing state, Day phase.
- No execution may have already occurred this day (`executedToday` must be absent).
- Caller must be alive.
- Caller may not have already nominated today (`nominatedByPlayerIds`).
- `nomineeId` must be a string, must differ from the caller, and must be an existing player.
- The same player may not be nominated twice in one day (checked against `nominations`).
- A Butler may not nominate their master (`butlerMasterId`).

---

### `cast-public-vote`

**Who:** Living player (or dead player spending their ghost vote)
**When:** During the Day phase, while an open nomination exists
**Effect:** Casts a yes/no vote on the most recent open nomination. A Butler may only vote yes if their master has already voted yes on the same nomination.

**Payload:** `{ voted: boolean }`

**Validation:**

- Game must be in Playing state, Day phase.
- There must be at least one open nomination.
- Caller must not have already voted on the active nomination.
- Dead players may vote only if they have not yet spent their ghost vote (`ghostVotesUsed`).
- A Butler voting yes must have their master (`butlerMasterId`) already recorded as a yes vote on the same nomination.

---

### `close-nominations`

**Who:** Storyteller (owner) only
**When:** During the Day phase, before an execution has occurred this day
**Effect:** Tallies all open nominations and resolves whether an execution occurs. A nomination must have strict-majority yes votes (more than 50% of alive players) to qualify. If exactly one nomination qualifies, its nominee is executed (added to `deadPlayerIds` and `executedToday`). If multiple nominations tie for the top qualifying count, no execution occurs.

**Payload:** none

**Validation:**

- Caller must be the game owner (`ownerPlayerId`).
- Game must be in Playing state, Day phase.
- No execution may have already occurred this day (`executedToday` must be absent).

---

## Action Payload Summary

| Action              | Caller      | Payload                 |
| ------------------- | ----------- | ----------------------- |
| `nominate-player`   | Player      | `{ nomineeId: string }` |
| `cast-public-vote`  | Player      | `{ voted: boolean }`    |
| `close-nominations` | Storyteller | none                    |

## Special-Case Abilities

### Virgin

When a Townsfolk nominates the Virgin for the first time (and the Townsfolk is not poisoned), the nominator is immediately executed instead of the nomination proceeding. `virginAbilityUsed` is set to `true` on the turn state so the ability cannot fire a second time.

### Butler

The Butler's master is recorded in `butlerMasterId` on the turn state (set during the Butler's night action). The Butler may not nominate their master and may only vote yes on a nomination if their master has already cast a yes vote on the same nomination.
