# Secret Villain — Actions

Secret Villain is fully app-mediated. All gameplay flows through the actions listed below.

## Election Phase

| Action                  | Who        | When                                 | Effect                                                                                                          |
| ----------------------- | ---------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `nominate-chancellor`   | President  | ElectionNomination phase             | Sets chancellor nominee, transitions to ElectionVote                                                            |
| `cast-election-vote`    | Any player | ElectionVote phase (once per player) | Records aye/no vote; auto-tallies when all voted                                                                |
| `resolve-election`      | Any player | ElectionVote, before tally           | Tallies votes, sets `passed`                                                                                    |
| `advance-from-election` | Any player | ElectionVote, after tally            | Transitions to PolicyPresident or SpecialBadReveal (if chancellor win condition), or next nomination on failure |

## Special Bad Reveal Phase

Entered when an election passes and the elected chancellor is the Special Bad with 3+ Bad cards played. All players see a waiting screen; only the chancellor can act.

| Action                            | Who        | When                           | Effect                                                 |
| --------------------------------- | ---------- | ------------------------------ | ------------------------------------------------------ |
| `confirm-special-bad`             | Chancellor | SpecialBadReveal, before acted | Sets `revealed = false` (denies being Special Bad)     |
| `reveal-special-bad`              | Chancellor | SpecialBadReveal, before acted | Sets `revealed = true` (reveals as Special Bad)        |
| `advance-from-special-bad-reveal` | Any player | SpecialBadReveal, after acted  | If revealed: Bad team wins. Otherwise: PolicyPresident |

## Policy Phase

| Action              | Who        | When                           | Effect                                                 |
| ------------------- | ---------- | ------------------------------ | ------------------------------------------------------ |
| `president-draw`    | President  | PolicyPresident, before draw   | Reveals drawn cards to president                       |
| `president-discard` | President  | PolicyPresident, after draw    | Discards 1 card, passes 2 to chancellor                |
| `chancellor-play`   | Chancellor | PolicyChancellor               | Plays 1 card; triggers special action or next election |
| `propose-veto`      | Chancellor | PolicyChancellor (4+ bad)      | Proposes veto to president                             |
| `respond-veto`      | President  | PolicyChancellor, veto pending | Accepts (discard both, fail election) or rejects       |

## Special Actions

| Action                        | Who       | When                             | Effect                                                 |
| ----------------------------- | --------- | -------------------------------- | ------------------------------------------------------ |
| `select-investigation-target` | President | SpecialAction: InvestigateTeam   | Selects target, awaits consent                         |
| `consent-investigation`       | Target    | SpecialAction: InvestigateTeam   | Reveals team to president                              |
| `resolve-investigation`       | President | SpecialAction: after result seen | Advances to next election                              |
| `call-special-election`       | President | SpecialAction: SpecialElection   | Appoints next president, advances                      |
| `shoot-player`                | President | SpecialAction: Shoot             | Eliminates player; checks Good win if Special Bad shot |
| `policy-peek`                 | President | SpecialAction: PolicyPeek        | Reveals top 3 deck cards to president                  |
| `resolve-policy-peek`         | President | SpecialAction: after peek        | Advances to next election                              |
