# Game Mode Documentation

This directory contains documentation for each supported game mode.

## Game Modes

### Werewolf

A night-phase deduction game. Villagers try to identify and eliminate Werewolves during the day; Werewolves secretly eliminate Villagers at night. The owner acts as Narrator and controls the night phase progression. The app mediates all gameplay: night-phase targeting, daytime nominations and trials, and win condition detection.

- [Roles](werewolf/roles.md) — all roles, their teams, night-waking behavior, and visibility rules
- [Actions](werewolf/actions.md) — narrator and player actions, payloads, validation rules, and night resolution
- [Data Flow](werewolf/data-flow.md) — `PlayerGameState` fields per player type, Firebase schema, and per-phase data flow

### Secret Villain

A social deduction game inspired by Secret Hitler. One Bad player (the Special Bad) cannot identify their own teammates. Regular Bad players know the full Bad team (including who the Special Bad is); the Special Bad must operate without knowledge of their allies. Players run elections to select a President and Chancellor, then enact policies. The app mediates all gameplay: elections, policy phases, and presidential special actions (investigate, policy peek, special election, shoot).

- [Roles](secret-villain/roles.md) — three roles with deliberate visibility asymmetry
- [Actions](secret-villain/actions.md) — all player actions across election, policy, and special action phases
- [Data Flow](secret-villain/data-flow.md) — `PlayerGameState` fields by phase and role, Firebase schema, and phase transitions

### Avalon

A quest-voting game set in Arthurian legend. Players on the Good team try to pass quests while Bad players sabotage them. The app handles role distribution and initial role visibility only; questing, team selection, and voting all happen outside the app.

- [Roles](avalon/roles.md) — three roles with asymmetric visibility
- [Actions](avalon/actions.md) — no app-managed actions
- [Data Flow](avalon/data-flow.md) — `PlayerGameState` fields and visibility rules
