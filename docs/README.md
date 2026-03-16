# Game Mode Documentation

This directory contains documentation for each supported game mode.

## Game Modes

### Werewolf

A night-phase deduction game. Villagers try to identify and eliminate Werewolves during the day; Werewolves secretly eliminate Villagers at night. The owner acts as Narrator and controls the night phase progression.

- [Roles](werewolf/roles.md) — all roles, their teams, night-waking behavior, and visibility rules
- [Actions](werewolf/actions.md) — narrator and player actions, payloads, validation rules, and night resolution
- [Data Flow](werewolf/data-flow.md) — `PlayerGameState` fields per player type, Firebase schema, and per-phase data flow

### Avalon

A quest-voting game set in Arthurian legend. Players on the Good team try to pass quests while Bad players sabotage them. The app handles role distribution only; questing and voting happen outside the app.

- [Roles](avalon/roles.md) — three roles with asymmetric visibility
- [Actions](avalon/actions.md) — no app-managed actions
- [Data Flow](avalon/data-flow.md) — `PlayerGameState` fields and visibility rules

### Secret Villain

A social deduction game where one Bad player (the Special Bad) is hidden even from their own teammates. Bad players know the full team; the Special Bad operates alone. The app handles role distribution only.

- [Roles](secret-villain/roles.md) — three roles with deliberate visibility asymmetry
- [Actions](secret-villain/actions.md) — no app-managed actions
- [Data Flow](secret-villain/data-flow.md) — `PlayerGameState` fields and the Special Bad isolation mechanic
