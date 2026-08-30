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

### 1. Role visibility (significant concern)

The Board is **intentionally role-blind**: `resolveOwnerSeesRoleAssignments`
returns `false` when a Board is present, and [#297] specifies the Board "should
NOT see any hidden information." Supporting no-device players reverses this.

- **Scope the reversal narrowly**: deliver only the _no-device players'_ role
  map to the Board client, not every player's role, preserving the rest of
  #297's privacy intent.
- The Board's `PlayerGameState` (see
  [`secret-villain/data-flow.md`](../secret-villain/data-flow.md)) currently
  carries no role assignments at all; this is a server/player-state change, not
  just a UI change.
- The reveal UI should reuse Werewolf's pattern — the shared
  [`PlayersRoleList`](../../src/components/game/PlayersRoleList.tsx) grid with
  tap-to-reveal and grey-out-after-viewing (`OwnerStartingScreen`) — surfaced on
  the Board during the Starting phase.

### 2. Mid-game action mediation (the hard part)

Werewolf no-device players are simple: night actions are already narrator-driven.
Secret Villain is **not** — its core loop is a private, seat-specific exchange:

| Seat / phase        | Private information / action                      |
| ------------------- | ------------------------------------------------- |
| President (policy)  | Draws 3 policy cards, discards 1                  |
| Chancellor (policy) | Receives 2 cards, plays 1; may propose veto       |
| President (veto)    | Accepts / rejects the chancellor's veto           |
| Any voter           | Ja / Nein election vote                           |
| President (powers)  | Investigate, policy peek, special election, shoot |

If a no-device player holds one of these seats, the narrator must conduct their
hidden action on their device **without leaking it to anyone else**. The
**worst case is both President and Chancellor being no-device** — the entire
hidden policy exchange (draw → discard → pass → play) then happens on a single
device and must stay concealed from the table.

Open questions this raises:

- Does the Board device conduct these actions, or a separate owner surface?
- How are the existing `ActionGateView` privacy patterns adapted when the
  "player" is the narrator acting for someone else?
- Elections: how does the narrator enter Ja/Nein for each no-device voter
  without revealing the running tally prematurely?

### 3. Board privacy surface

The Board is described as a **shared/projected display** (big text, TV). That is
the worst possible place to reveal a secret role or conduct a hidden card
exchange. Werewolf's Narrator model assumes a **handheld** device. A decision is
needed:

- Assume the Board is handheld whenever no-device players are present; **or**
- Introduce a distinct owner/narrator surface for no-device mediation, separate
  from the projected Board.

The tap-to-reveal + grey-out guard mitigates a projected reveal but does not
eliminate the risk.

## Alternatives considered

- **Keep Secret Villain permanently no-device-free.** Cheapest; the interim gate
  already delivers this. Acceptable if the mediation complexity in §2 is judged
  not worth the payoff.
- **Support no-device only when a Board is enabled**, accepting §1 and §2 as
  scoped follow-up work. Preferred if narrator-run Secret Villain is a desired
  mode of play.

## References

- [#543] — Werewolf "Allow no-device users" (reference implementation).
- [#297] — Secret Villain optional Board player (role-blind by design).
- [`mode-services.ts`](../../src/lib/types/game/mode-services.ts) — the
  `resolveOwnerTitle` / `resolveOwnerSeesRoleAssignments` seams.
- Project principle: **Narrator-First / No-Device Player Principle** in
  `CLAUDE.md`.

[#297]: https://github.com/rmartz/hidden-role-game/issues/297
[#543]: https://github.com/rmartz/hidden-role-game/issues/543
[#857]: https://github.com/rmartz/hidden-role-game/issues/857
