---
type: Reference
title: No-Device Players & the Omniscient-Narrator Requirement
description: Why no-device players require an omniscient narrator, the interim gate that enforces it, and what full Secret Villain support would require.
tags: [design, no-device, narrator, secret-villain, werewolf]
---

# No-Device Players & the Omniscient-Narrator Requirement

## Summary

A **no-device player** is a participant with no device of their own; the lobby
owner creates, renames, and removes them, and the owner acts on their behalf
during play. Because such a player never sees their own screen, **their secret
role can only be revealed through the owner's device** — so the mechanic only
works in a game whose owner is an **omniscient narrator**: an owner surface that
(a) exists and (b) sees every role assignment.

Werewolf satisfies this (the Narrator sees all roles). **Secret Villain does
not** — it was designed narrator-less, and even its optional Board player is
deliberately role-blind (see [#297]). Yet the "Add no-device player" control was
offered in every mode, gated only on `isOwner`, letting a Secret Villain owner
create players the game can never reveal roles to.

This page records the **interim gate** that closes that hole (#857) and scopes
the work required to **lift** it for Secret Villain.

## The gate (implemented, #857)

`gameAllowsNoDevicePlayers(gameMode, modeConfig)` in
[`src/lib/game/modes.ts`](../../src/lib/game/modes.ts) is the single source of
truth:

```
ownerTitle          = resolveOwnerTitle?.(modeConfig) ?? ownerTitle
seesRoleAssignments = resolveOwnerSeesRoleAssignments?.(modeConfig) ?? true
allowed             = ownerTitle !== null && seesRoleAssignments
```

Both conditions are required. `resolveOwnerSeesRoleAssignments` defaults to
`true`, so an owner-less configuration (Secret Villain with no Board) would
otherwise pass on the visibility check alone — the `ownerTitle !== null` clause
is what rejects it.

| Configuration            | `ownerTitle` | sees roles | no-device? |
| ------------------------ | ------------ | ---------- | ---------- |
| Werewolf                 | `"Narrator"` | `true`     | **yes**    |
| Secret Villain + Board   | `"Board"`    | `false`    | no         |
| Secret Villain, no Board | `null`       | (n/a)      | no         |

Enforced at three layers:

- **Lobby UI** — [`PlayerList`](../../src/components/lobby/PlayerList.tsx) hides
  the "Add no-device player" dialog when `allowNoDevicePlayers` is false.
- **Add-player API** — `POST /api/lobby/[lobbyId]/players` rejects a no-device
  create (`400`) when the mode disallows it. UI gating alone is cosmetic.
- **Game-start API** — `validateGameStartPrerequisites`
  ([`src/server/game.ts`](../../src/server/game.ts)) rejects starting a game
  that still contains a no-device player without an omniscient narrator
  (reconciliation for lobbies that acquired such players before the gate).

## Lifting the gate for Secret Villain

Secret Villain's optional **Board** player is the natural narrator surface — it
already exists as "similar to the Narrator in Werewolf" ([#297]) and its presence
is a lobby-time flag (`includeBoard`). Turning it into a no-device reveal surface
requires the following, none of which is trivial.

### 1. The model: the Board acts as a no-device player, intermittently

The Board keeps its **own** role-blind view — `resolveOwnerSeesRoleAssignments`
stays `false` and [#297]'s "the Board sees no hidden information" is preserved.
The Board never becomes omniscient. Instead it gains a gated **"act as
&lt;no-device player&gt;"** mode: a scoped, privacy-preserving variant of the
existing debug per-player view
([`DebugGameView`](../../src/app/debug/DebugGameView.tsx) /
[`GameScreenForPlayer`](../../src/app/debug/GameScreenForPlayer.tsx)), which
already renders the whole game _as_ a chosen player from that player's own scoped
`PlayerGameState`.

- The Board momentarily switches into a single no-device player's seat, sees and
  acts on **only that player's** state, then reverts to Board mode.
- **Per-player scoping is inherent, not new work.** Each player's
  `PlayerGameState` is already computed server-side per caller, so fetching one
  no-device player's state leaks nothing about any other player — the Board is
  handed one player's view at a time, never a merged god-view. This is exactly
  why the role-blind `resolveOwnerSeesRoleAssignments` does **not** need
  reversing (superseding this doc's earlier framing).
- **The switcher is restricted to no-device players only.** Device-holding
  players' seats are never selectable — the Board may only stand in for players
  who have no screen of their own.

**Implementation seam:** the one genuinely new server capability is authorizing
the lobby owner to fetch a _no-device_ player's scoped `PlayerGameState` by that
player's id (device players excluded). The per-caller state builder already
exists; only the authorization boundary is new.

This single mechanism covers **both** the Starting-phase role reveal (act as
player X → X sees their own role, just as a device player would) and the
mid-game private actions below.

### 2. Mid-game action mediation

Secret Villain's core loop is a private, seat-specific exchange:

| Seat / phase        | Private information / action                      |
| ------------------- | ------------------------------------------------- |
| President (policy)  | Draws 3 policy cards, discards 1                  |
| Chancellor (policy) | Receives 2 cards, plays 1; may propose veto       |
| President (veto)    | Accepts / rejects the chancellor's veto           |
| President (powers)  | Investigate, policy peek, special election, shoot |

The "act as player" mechanism handles each: the Board switches into the
no-device seat, the player acts behind the existing
[`ActionGateView`](../../src/components/game/secret-villain/ActionGateView.tsx)
privacy prompt, then the Board reverts. The **both-President-and-Chancellor
no-device** worst case is handled by two sequential hand-offs (act as President →
revert → act as Chancellor), never one combined screen.

### 3. Voting is the exception — record the outcome, not each vote

Elections happen constantly and must be rapid, so a per-player "act as" hand-off
for every vote is impractical. Instead, assume **no-device players vote in
person** (thumbs up / thumbs down at the table) and use the Board only to
**record the aggregate election result**, not each no-device player's individual
Ja/Nein. This keeps the frequent path fast and avoids passing the tablet around
mid-vote. (Device players still vote on their own screens.)

### 4. Handheld requirement & the projected-board hazard (must warn)

The whole model depends on the Board being a **handheld** surface — a tablet the
owner holds and individual no-device players can briefly pick up. The intended
workflow:

> player picks up the tablet → Board switches to "act as me" → player acts behind
> the ActionGate → reverts to Board mode → player sets the tablet down.

A **projected / cast / TV Board fundamentally breaks this** — a private reveal or
card exchange would be shown to the whole room. When no-device players are
present, the UI must **strictly warn against projecting the Board**, and we
should consider hard-disallowing screen-share / cast in that configuration. The
tap-to-reveal + grey-out guard mitigates an accidental glance but does not make a
projected Board safe.

## Alternatives considered

- **Keep Secret Villain permanently no-device-free.** Cheapest; the interim gate
  already delivers this. Acceptable if the act-as-player mediation (§1–§4) is
  judged not worth the payoff.
- **Support no-device only when a Board is enabled**, accepting §1–§4 as scoped
  follow-up work. Preferred if narrator-run Secret Villain is a desired mode of
  play.

## References

- [#543] — Werewolf "Allow no-device users" (reference implementation).
- [#297] — Secret Villain optional Board player (role-blind by design).
- [`mode-services.ts`](../../src/lib/types/game/mode-services.ts) — the
  `resolveOwnerTitle` / `resolveOwnerSeesRoleAssignments` seams.
- [`DebugGameView`](../../src/app/debug/DebugGameView.tsx) — the existing
  per-player "view as X" pattern the act-as-player model is based on.
- Project principle: **Narrator-First / No-Device Player Principle** in
  `CLAUDE.md`.

[#297]: https://github.com/rmartz/hidden-role-game/issues/297
[#543]: https://github.com/rmartz/hidden-role-game/issues/543
[#857]: https://github.com/rmartz/hidden-role-game/issues/857
