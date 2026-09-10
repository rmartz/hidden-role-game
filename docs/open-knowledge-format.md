---
type: Reference
title: Open Knowledge Format (OKF)
description: What OKF is, how this repo applies it to docs/ pages, and the authoritative Google spec to consult for any question about the format.
tags: [documentation, okf, reference, ci]
---

# Open Knowledge Format (OKF)

Every page under `docs/` is written in the **Open Knowledge Format (OKF)** — a lightweight
convention for structuring reference knowledge as markdown with machine-readable frontmatter, so
a human or an agent can discover, retrieve, and traverse it before starting a task.

**The authoritative specification is the [OKF SPEC on GitHub](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md).**
It is the source of truth for any question about the format — field semantics, the index model, or
anything this page does not cover. This page documents only **how this repository applies OKF**; where
the two ever appear to disagree, the spec wins and this page should be corrected.

## Why we use it

Maintaining docs as free-form prose lets them drift out of sync with the code and makes them hard to
retrieve programmatically. OKF gives every page a small, consistent frontmatter header (what the page
is, what it documents) and a navigable index, so the docs stay discoverable and their scope stays
explicit. The conventions below are enforced in CI (see [Enforcement](#enforcement)), so they cannot
silently rot.

## Frontmatter

Every **content** page begins with a YAML frontmatter block delimited by `---` fences (the
reserved `index.md` is exempt — see [The index](#the-index)):

```yaml
---
type: Roles
title: Werewolf — Roles
description: All Werewolf roles, their teams, night-waking behavior, and visibility rules.
gameMode: werewolf
resource: src/lib/game/modes/werewolf
tags: [werewolf, roles, night-phase]
---
```

### Fields

| Field         | Required                | Meaning                                                            |
| ------------- | ----------------------- | ------------------------------------------------------------------ |
| `type`        | always                  | The kind of page — one of the values in [Page types](#page-types). |
| `title`       | always                  | Human-readable page title.                                         |
| `description` | always                  | One-sentence summary of what the page covers.                      |
| `gameMode`    | per-mode pages          | The game-mode slug (e.g. `werewolf`) the page documents.           |
| `resource`    | per-mode pages          | Repo-relative path to the documented source; the path must exist.  |
| `tags`        | optional (conventional) | Free-form keywords for retrieval.                                  |

`gameMode` and `resource` are required on the per-mode page types (`Roles`, `Actions`, `DataFlow`)
and optional elsewhere.

### Page types

The `type` vocabulary in this repo:

| Type        | Meaning                                                     |
| ----------- | ----------------------------------------------------------- |
| `Index`     | A directory index (`index.md`) — see below.                 |
| `Guide`     | Task-oriented walkthrough (onboarding, how-to).             |
| `Reference` | Structural reference not tied to a single game mode.        |
| `Roles`     | A game mode's roles, teams, and visibility rules.           |
| `Actions`   | A game mode's actions, payloads, and validation.            |
| `DataFlow`  | A game mode's `PlayerGameState` fields and Firebase schema. |

## The index

OKF's canonical directory index is **`index.md`** (not `README.md`) — per the spec, _"an `index.md`
file MAY appear in any directory, including the bundle root"_ and enumerates that directory's contents
to support progressive disclosure. In this repo:

- The top-level index is [`docs/index.md`](index.md); a subdirectory that needs its own index uses
  `<dir>/index.md`.
- **The `index.md` filename is reserved and carries no frontmatter.** Per the spec (§8, §11) an
  index file is exempt from the `type`/`title`/`description` requirement above; the one allowed key
  is `okf_version` (which the root `index.md` MAY carry). Any other frontmatter key on an `index.md`
  is rejected. This is why [`docs/index.md`](index.md) opens with only `okf_version: "0.2"`.
- **Every page must be reachable from `docs/index.md` by following links through `index.md` files** —
  directly, or via a sub-`index.md` that (transitively) links to it — so a reader can navigate
  `docs/index.md → sub-index → page`. A page that no index reaches is an orphan and is rejected.
- When you add a page, link it from the appropriate `index.md`.

Because GitHub auto-renders a folder's `README.md` (not `index.md`), browsing the `docs/` folder on
GitHub will not show a landing page; open [`index.md`](index.md) directly. This is the accepted cost
of following the OKF canonical filename.

## Enforcement

Both rules — valid frontmatter and index reachability — are checked in CI by
`pnpm run check:docs` (`scripts/check-docs.mjs`), which runs via the **Docs** workflow on any PR that
changes a `docs/` page or the checker. Run it locally with:

```bash
pnpm run check:docs
```

## Related

- [Documentation Index](index.md) — the root `index.md` this page is linked from.
- [OKF SPEC](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — the
  authoritative specification.
