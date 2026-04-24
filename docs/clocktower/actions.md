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
**Effect:** Sets, clears, or skips a player's night action target.

**Payload:** `{ roleId?: string; targetPlayerId?: string | null }`

- `targetPlayerId: string` — set target
- `targetPlayerId: null` — intentional skip (no target this night)
- `targetPlayerId: undefined` — clear selection

**Validation:**

- Target must exist, not be dead, not be the Storyteller.
- Players cannot change a confirmed action; the Storyteller can always override.
- Storyteller must supply a `roleId` matching a role in the current game.
- For the Fortune Teller, `secondTargetPlayerId` may be included in the same payload as `targetPlayerId`. It is subject to the same constraints: must be a valid, alive, in-game player who is not the Storyteller.

---

### `confirm-night-target`

**Who:** Player only (Storyteller overrides directly via `set-night-target`)
**When:** During Night phase
**Effect:** Locks in the player's target selection. Prevents further changes by the player.

**Payload:** none

**Validation:**

- Caller must not be the Storyteller.
- An action (target or skip) must already be set.
- Fortune Teller requires both `targetPlayerId` and `secondTargetPlayerId` to be set (unless skipping).
- Cannot re-confirm an already-confirmed action.

---

### `provide-information`

**Who:** Storyteller only
**When:** During Night phase, after an information role wakes
**Effect:** Records the information the Storyteller shows to an information role. Does not expose this to other players.

**Payload:** `{ roleId: string; information: ClocktowerInformation }`

Information shapes by role type:

- **Numeric** (`Empath`, `Chef`): `{ type: "number"; value: number }`
- **Yes/No** (`Fortune Teller`): `{ type: "boolean"; value: boolean }`
- **Two-player + role** (`Washerwoman`, `Librarian`, `Investigator`, `Undertaker`, `Ravenkeeper`): `{ type: "player-role"; playerIds: [string, string]; roleId: string }`

**Validation:**

- Caller must be the Storyteller.
- `roleId` must be assigned in the current game.
- `information` must match one of the three valid shapes; `player-role.roleId` must be a known `ClocktowerRole`.

---

### `resolve-night`

**Who:** Storyteller only
**When:** During Night phase, after all kill-action roles have acted
**Effect:**

1. Resolves the Imp's kill, accounting for Monk protection and Soldier immunity.
2. If the Imp targeted themselves: adds Imp to `deadPlayerIds` and transfers the Demon role (Scarlet Woman priority when 5+ players alive, otherwise first living Minion).
3. Updates `poisonedPlayerId` from the Poisoner's action (clears it if Poisoner had no action).
4. Advances `currentActionIndex` by 1 so information roles can wake next.

**Payload:** none

---

### `advance-night-step`

**Who:** Storyteller only
**When:** During Night phase
**Effect:** Advances `currentActionIndex` by 1. Used to step through the night action order (e.g., after an information role has been shown their information).

**Payload:** none
