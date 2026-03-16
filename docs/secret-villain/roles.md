# Secret Villain — Roles

## Overview

Secret Villain is a social deduction game where one Bad player (the Special Bad) is hidden even from their own team. Bad players know each other but do not know which one is the Special Bad.

## Role Table

| Role             | ID            | Team | Special Properties                        |
| ---------------- | ------------- | ---- | ----------------------------------------- |
| Good Role        | `good`        | Good | No special visibility                     |
| Bad Role         | `bad`         | Bad  | Can see all other Bad players             |
| Special Bad Role | `special-bad` | Bad  | No `canSeeTeam` — isolated from teammates |

## Role Properties

```typescript
interface RoleDefinition {
  id: string;
  name: string;
  team: Team; // Good | Bad
  canSeeTeam?: Team[]; // Teams whose members this role can identify
}
```

## Default Role Distribution

For `n` total players:

| Role             | Count             |
| ---------------- | ----------------- |
| Special Bad Role | 1                 |
| Bad Role         | `⌊(n−1) / 2⌋ − 1` |
| Good Role        | remaining         |

Minimum players: 5.

## Visibility Rules

- **Bad roles** see all other Bad players, including the Special Bad (`canSeeTeam: [Team.Bad]`).
- **Special Bad role** has no `canSeeTeam` — cannot identify any teammates.
- **Good roles** see only their own identity.

This asymmetry means regular Bad players know who the Special Bad is, but the Special Bad does not know their allies.
