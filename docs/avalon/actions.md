# Avalon — Actions

Actions are the mechanism by which the Quest Leader and players mutate game state. Each action has an `isValid` guard and an `apply` mutation.

## Action Reference

### `propose-team`

**Who:** Quest Leader only
**When:** During `TeamProposal` phase
**Effect:** Validates and submits the proposed quest team. Transitions the phase to `TeamVote` with the proposed team and an empty votes array.

**Payload:** `{ teamPlayerIds: string[] }` — must be exactly `teamSize` distinct valid player IDs

---

### `cast-team-vote`

**Who:** Any player
**When:** During `TeamVote` phase, before the vote is resolved (`passed` is undefined)
**Effect:** Records or updates the calling player's approve/reject vote. A player may change their vote before resolution.

**Payload:** `{ vote: "approve" | "reject" }`

---

### `resolve-team-vote`

**Who:** Any player (narrator triggers in practice)
**When:** During `TeamVote` phase, before the vote is tallied (`passed` is undefined)
**Effect:** Tallies all votes: approvals strictly greater than rejections = `passed: true`, otherwise `passed: false`. Does not advance the phase.

**Payload:** none

---

### `advance-from-team-vote`

**Who:** Any player (narrator triggers in practice)
**When:** During `TeamVote` phase, after the vote is tallied (`passed` is set)
**Effect:**

- **Approved (`passed: true`):** Resets `consecutiveRejections` to 0. Transitions to `Quest` phase with the proposed team.
- **Rejected (`passed: false`):** Increments `consecutiveRejections`. If `consecutiveRejections >= 5`, Evil wins immediately (`victoryConditionKey: "consecutive-rejections"`). Otherwise rotates the Quest Leader and returns to `TeamProposal` with the next leader and the same quest's team size.

**Payload:** none

---

### `play-quest-card`

**Who:** Team members only (players in `teamPlayerIds`)
**When:** During `Quest` phase, before the quest is resolved (`failCount` is undefined)
**Effect:** Records the calling player's Success or Fail card. Good-aligned players are server-side enforced to play Success only. Each player may only submit once.

**Payload:** `{ card: "success" | "fail" }`

---

### `resolve-quest`

**Who:** Any player (narrator triggers in practice)
**When:** During `Quest` phase, after all team members have submitted cards (`cards.length === teamPlayerIds.length`), before resolution (`failCount` is undefined)
**Effect:** Counts the number of Fail cards. Sets `failCount` and `succeeded` on the phase. `succeeded` is `true` if `failCount < failThreshold` (threshold is 1 normally, 2 for quests in `requiresTwoFails`). Does not advance the phase.

**Payload:** none

---

### `advance-from-quest`

**Who:** Any player (narrator triggers in practice)
**When:** During `Quest` phase, after the quest is resolved (`failCount` is set)
**Effect:**

- Records the quest result in `questResults` (including `teamPlayerIds`, `failCount`, `succeeded`).
- If Good has won 3 quests and the Assassin role exists: transitions to `Assassination` phase.
- If Good has won 3 quests and no Assassin: Good wins immediately (`victoryConditionKey: "quests"`).
- If Evil has won 3 quests: Evil wins immediately (`victoryConditionKey: "quests"`).
- Otherwise: increments `questNumber`, rotates the Quest Leader, and transitions to `TeamProposal` for the next quest.

**Payload:** none

---

### `selectAssassinationTarget`

**Who:** Assassin player only
**When:** During `Assassination` phase, before resolve
**Effect:** Sets the Assassin's target. The Assassin may change their selection before `resolveAssassination` is called.

**Payload:** `{ targetPlayerId: string }` — must be a valid player ID in the game

---

### `resolveAssassination`

**Who:** Any player (narrator triggers in practice)
**When:** During `Assassination` phase, after a target has been selected
**Effect:** Determines the outcome:

- **Target is Merlin** → `correct: true` on the phase, game ends with Evil winning (`winner: "Bad"`, `victoryConditionKey: "assassination"`).
- **Target is not Merlin** → `correct: false` on the phase, game ends with Good winning (`winner: "Good"`, `victoryConditionKey: "assassination-failed"`).

**Payload:** none

---

## Action Payload Summary

| Action                      | Caller                            | Payload                                |
| --------------------------- | --------------------------------- | -------------------------------------- |
| `propose-team`              | Quest Leader                      | `{ teamPlayerIds: string[] }`          |
| `cast-team-vote`            | Any player                        | `{ vote: "approve" \| "reject" }`      |
| `resolve-team-vote`         | Any player (narrator in practice) | none                                   |
| `advance-from-team-vote`    | Any player (narrator in practice) | none                                   |
| `play-quest-card`           | Team member                       | `{ card: "success" \| "fail" }`        |
| `resolve-quest`             | Any player (narrator in practice) | none                                   |
| `advance-from-quest`        | Any player (narrator in practice) | none                                   |
| `selectAssassinationTarget` | Assassin player                   | `{ targetPlayerId: string }`           |
| `resolveAssassination`      | Any player (narrator in practice) | none                                   |

## Phase State Machine

```
TeamProposal → (propose-team) → TeamVote
TeamVote → (resolve-team-vote) → TeamVote[resolved]
TeamVote[resolved, passed] → (advance-from-team-vote) → Quest
TeamVote[resolved, rejected, <5 rejections] → (advance-from-team-vote) → TeamProposal[next leader]
TeamVote[resolved, rejected, 5 rejections] → (advance-from-team-vote) → Finished[Evil wins]
Quest → (play-quest-card×N) → Quest[all cards submitted]
Quest[all cards submitted] → (resolve-quest) → Quest[resolved]
Quest[resolved, Good wins 3] + Assassin exists → (advance-from-quest) → Assassination
Quest[resolved, Good wins 3] + no Assassin → (advance-from-quest) → Finished[Good wins]
Quest[resolved, Evil wins 3] → (advance-from-quest) → Finished[Evil wins]
Quest[resolved, no winner yet] → (advance-from-quest) → TeamProposal[next quest, next leader]
Assassination → (selectAssassinationTarget) → Assassination[target set]
Assassination[target set] → (resolveAssassination) → Finished[Good or Evil wins]
```
