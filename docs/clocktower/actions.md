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
