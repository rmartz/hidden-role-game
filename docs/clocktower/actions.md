# Clocktower — Actions

Actions are the mechanism by which the Storyteller and players mutate game state. Each action has an `isValid` guard and an `apply` mutation.

In Clocktower, night actions are **Storyteller-mediated**: players select targets, the Storyteller sees those targets and manually provides information to information roles (accounting for poisoning, drunkenness, etc.).

## Night Action Order (Trouble Brewing)

1. Poisoner — chooses a player to poison
2. Monk — chooses a player to protect (not first night)
3. Imp — chooses a kill target
4. `resolve-night` — Storyteller resolves kills
5. Information roles wake in order: Washerwoman, Librarian, Investigator, Chef (first night only), Empath, Fortune Teller, Undertaker (after execution night), Ravenkeeper (on-death only), Spy

## Action Reference

### `set-night-target`

**Who:** Player (inferred from role) or Storyteller (explicit `roleId`)
**When:** During Night phase
**Effect:** Sets or clears a player's night action target.

**Payload:** `{ roleId?: string; targetPlayerId?: string; secondTargetPlayerId?: string }`

- `targetPlayerId: string` — set target
- `targetPlayerId: undefined` — clear selection (also clears `secondTargetPlayerId`)

**Validation:**

- Target must exist, not be dead, not be the Storyteller.
- Players cannot change a confirmed action; the Storyteller can always override.
- Storyteller must supply a `roleId` matching a role in the current game.
- `secondTargetPlayerId` is Fortune Teller-only; it is rejected for any other role. It is subject to the same constraints as `targetPlayerId`: must be a valid, alive, in-game player who is not the Storyteller.

---

### `confirm-night-target`

**Who:** Player (inferred from role) or Storyteller (explicit `roleId`)
**When:** During Night phase
**Effect:** Locks in the target selection for a role. Prevents further changes by the player.

**Payload:** `{ roleId?: string }` — Storyteller only: which role's action to confirm

**Validation:**

- A night action entry must already exist for the role.
- `targetPlayerId` must be set on the entry.
- Fortune Teller requires both `targetPlayerId` and `secondTargetPlayerId` to be set.
- Cannot re-confirm an already-confirmed action.

---

### `provide-information`

**Who:** Storyteller only
**When:** During Night phase, after an information role wakes
**Effect:** Records the information the Storyteller shows to an information role. Does not expose this to other players.

**Payload:** `{ roleId: string; information: ClocktowerNightInformation }`

Information shapes by role type:

- **Numeric** (`Empath`, `Chef`): `{ type: "number"; value: number }`
- **Yes/No** (`Fortune Teller`): `{ type: "boolean"; value: boolean }`
- **Role only** (`Undertaker`, `Ravenkeeper`): `{ type: "role"; roleId: string }`
- **Two-player + role** (`Washerwoman`, `Librarian`, `Investigator`): `{ type: "two-players-role"; playerIds: [string, string]; roleId: string }`

**Validation:**

- Caller must be the Storyteller.
- `roleId` must be a known `ClocktowerRole`.
- `information` must match one of the four valid shapes; `role`/`two-players-role` `roleId` must be a known `ClocktowerRole`.

---

### `resolve-night`

**Who:** Storyteller only
**When:** During Night phase, after all kill-action roles have acted
**Effect:** Resolves all kill mechanics for the night and advances to the information phase.

**Payload:** `{}` (no fields required)

**Validation:**

- Caller must be the Storyteller.
- Game must be in Night phase.

**Apply:**

1. Resolves the Imp's kill, accounting for Monk protection and Soldier immunity.
2. If the Imp targeted themselves: adds Imp to `deadPlayerIds` and transfers the Demon role (Scarlet Woman priority when 5+ players alive, otherwise first living Minion in assignment order).
3. Updates `poisonedPlayerId` from the Poisoner's action (clears it if Poisoner had no action entry).
4. Advances `currentActionIndex` by 1 so information roles can wake next.

---

### `advance-night-step`

**Who:** Storyteller only
**When:** During Night phase
**Effect:** Advances `currentActionIndex` by 1. Used to step through the night action order after an information role has been shown their information.

**Payload:** `{}` (no fields required)

**Validation:**

- Caller must be the Storyteller.
- Game must be in Night phase.

---

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

| Action                 | Caller      | Payload                                                                       |
| ---------------------- | ----------- | ----------------------------------------------------------------------------- |
| `set-night-target`     | Player/ST   | `{ roleId?: string; targetPlayerId?: string; secondTargetPlayerId?: string }` |
| `confirm-night-target` | Player/ST   | `{ roleId?: string }`                                                         |
| `provide-information`  | Storyteller | `{ roleId: string; information: ClocktowerNightInformation }`                 |
| `resolve-night`        | Storyteller | `{}`                                                                          |
| `advance-night-step`   | Storyteller | `{}`                                                                          |
| `nominate-player`      | Player      | `{ nomineeId: string }`                                                       |
| `cast-public-vote`     | Player      | `{ nomineeId: string, voted: boolean }`                                       |
| `close-nominations`    | Storyteller | none                                                                          |

## Special-Case Abilities

### Virgin

When a Townsfolk nominates the Virgin for the first time (and the Townsfolk is not poisoned), the nominator is immediately executed instead of the nomination proceeding. `virginAbilityUsed` is set to `true` on the turn state so the ability cannot fire a second time.

### Butler

The Butler's master is recorded in `butlerMasterId` on the turn state (set during the Butler's night action). The Butler may not nominate their master. When voting, the Butler must mirror their master's recorded vote exactly: the master must have already voted on the nomination before the Butler can vote, and the Butler's `voted` value must match the master's.
