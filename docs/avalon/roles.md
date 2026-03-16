# Avalon — Roles

## Overview

Avalon is a social deduction game with no night phase. Players are split into Good and Evil teams and vote on quests.

## Role Table

| Role              | ID                    | Team | Special Properties                  |
| ----------------- | --------------------- | ---- | ----------------------------------- |
| Good Role         | `avalon-good`         | Good | No special visibility               |
| Special Good Role | `avalon-special-good` | Good | Can see all Evil (Team Bad) players |
| Bad Role          | `avalon-bad`          | Bad  | Can see all other Bad players       |

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

| Role              | Count         |
| ----------------- | ------------- |
| Bad Role          | `⌊(n−1) / 2⌋` |
| Special Good Role | 1             |
| Good Role         | remaining     |

Minimum players: 5.

## Visibility Rules

- **Bad roles** see all other Bad players (`canSeeTeam: [Team.Bad]`).
- **Special Good role** sees all Bad players (`canSeeTeam: [Team.Bad]`).
- **Good roles** see only their own identity.
- Dead player role reveal does not apply — Avalon has no elimination mechanic tracked by the app.
