# Clocktower — Actions

Actions are the mechanism by which the Storyteller and players mutate game state. Each action has an `isValid` guard and an `apply` mutation.

## Action Reference

### `nominate-player`

**Who:** Living player
**When:** During the Day phase, before an execution has occurred this day
**Effect:** Nominates another player for execution. Each player may nominate at most once per day. A player may be nominated by multiple different nominators on the same day. If the nominee is the Virgin and a Townsfolk nominator triggers the Virgin's one-time ability, the nominator is immediately executed and the nomination ends without adding an open nomination.

**Payload:** `{ nomineeId: string }`

**Validation:**

- Game must be in Playing state, Day phase.
- No execution may have already occurred this day (`executedToday` must be absent).
- Caller must be alive.
- Caller may not have already nominated today (`nominatedByPlayerIds`).
- `nomineeId` must be a string, must differ from the caller, and must be an existing player.
- A player may be nominated multiple times per day by different nominators.
- A Butler may not nominate their master (`butlerMasterId`).

---

### `cast-public-vote`

**Who:** Living player (or dead player spending their ghost vote)
**When:** During the Day phase, while an open nomination exists for the target nominee
**Effect:** Casts or updates a yes/no vote on the nomination identified by `nomineeId`. If the caller has already voted on that nomination, the existing vote is replaced. A Butler must mirror their master's recorded vote — the master must have already voted before the Butler can vote, and Butler's vote must match the master's.

**Payload:** `{ nomineeId: string, voted: boolean }`

**Validation:**

- Game must be in Playing state, Day phase.
- `nomineeId` must identify an existing open nomination.
- Dead players may vote only if they have not yet spent their ghost vote (`ghostVotesUsed`), and may only vote yes.
- A Butler must have their master (`butlerMasterId`) already recorded as a vote on the same nomination, and the Butler's `voted` must match the master's recorded vote.

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

| Action              | Caller      | Payload                                 |
| ------------------- | ----------- | --------------------------------------- |
| `nominate-player`   | Player      | `{ nomineeId: string }`                 |
| `cast-public-vote`  | Player      | `{ nomineeId: string, voted: boolean }` |
| `close-nominations` | Storyteller | none                                    |

## Special-Case Abilities

### Virgin

When a Townsfolk nominates the Virgin for the first time (and the Townsfolk is not poisoned), the nominator is immediately executed instead of the nomination proceeding. `virginAbilityUsed` is set to `true` on the turn state so the ability cannot fire a second time.

### Butler

The Butler's master is recorded in `butlerMasterId` on the turn state (set during the Butler's night action). The Butler may not nominate their master. When voting, the Butler must mirror their master's recorded vote exactly: the master must have already voted on the nomination before the Butler can vote, and the Butler's `voted` value must match the master's.
