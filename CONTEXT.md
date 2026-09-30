# DEW Design System - working context

> **Binding rules live in `CONTRACTS.md`** (loaded by scope from `.claude/rules/contracts-*.md`, see
> CONTRACTS.md 5.5). This file is only the index. The standing reference that used to live here was moved,
> unchanged, into scoped files that load when a matching file is read, so a session no longer carries
> all of it. Where a clause and a reference disagree, `CONTRACTS.md` wins and the reference is corrected.

## Where things are

| File | What it holds | Loads when a session reads |
| --- | --- | --- |
| `.claude/rules/ref-shell.md` | Current practice only: cognitive-load principles, what a `/pages/**` screen is, build hierarchy, the collection pattern (list -> deep dive), external references, backlog, registered-user dashboard scope | `app/pages/**`, nav and role-matrix files |
| `.claude/rules/ref-ingest.md` | Current practice only: Figma as source of truth, new component workflow, QA check, doc page template, generated `/test-*` screens, custom components | `components/**`, doc pages, nav and design-system config |
| `.claude/rules/ref-scaffold.md` | DEW vs Scaffold: what is product and what operates or wraps it (doc controls, lab controls, the Prototype tools bar) | `components/**`, doc pages, `app/proto/**`, `app/_prototype-tools/**` |
| `.claude/rules/ref-domain.md` | BDBSA domain research: the data hierarchy, access tiers, partner organisations, the confirmed data model | map-search, project, observation and nomination files |
| `.claude/rules/ref-roles.md` | Current practice only: the six user roles, choosing and previewing a role, the role-access matrix, record access levels | role, header, rail and nav files |
| `context/archive/final-check.md` | The old "Final check" list, kept verbatim with a table of the clause each bullet became | never (archive) |
| `context/archive/exploratory-layouts-history.md` | Four superseded bullets of "Exploratory page layouts" (nav-chrome exemption, Projects becoming a leaf, public-user across the option-1 shells, the project-detail rejected options), with a table of where each topic lives now | never (archive) |
| `context/archive/ref-shell-history.md` | `ref-shell.md` verbatim as it stood before the 2026-09-29 trim: the option-1 shell history, worked examples, the Supabase pattern catalog | never (archive) |
| `context/archive/ref-roles-history.md` | `ref-roles.md` verbatim as it stood before the 2026-09-29 rewrite: the `useRoleHref` and org-pill incident histories, the option-1 examples | never (archive) |
| `context/archive/ref-ingest-history.md` | `ref-ingest.md` verbatim as it stood before the 2026-09-29 rewrite: the incident behind each QA item, the Avatar-page history | never (archive) |
| `context/archive/context-intro.md` | The original introduction of this file | never (archive) |
| `context/reports/` | Measured reports: `2026-09-29-rule-loading-benchmark.md`, rule loading before and after (re-run with `npm run bench:rules`, `npm run test:rules-hook`) | never (read when needed) |
| `context/decisions/` | The dated history, one file per decision; `INDEX.md` lists them | never (read or grep when a task needs history) |

## Where a section went

Older comments and notes say "see CONTEXT.md's X". X is now here:

- "Final check", the non-negotiable contracts list: `context/archive/final-check.md`; every bullet is now a clause in CONTRACTS.md (flow-through rule §1.3, placeholder-person convention and "no fabricated" §0.3, the non-negotiable table pattern §4.2, Figma and lo-fi §2.5, the shell contracts §3.1-§3.7).
- The superseded bullets of "Exploratory page layouts" (the nav-chrome exemption, the Projects-as-a-leaf history, public-user across the option-1 shells, the project-detail rejected-options list, the "Meta Under Title, Full Rail" and "Grouped by Type + Search" decisions): `context/archive/exploratory-layouts-history.md`.
- "Design principles (cognitive load)", "Exploratory page layouts", "Build hierarchy", "List -> deep dive", "Adopting UX patterns from external references", "Backlog", "Registered User dashboard scope": `.claude/rules/ref-shell.md`.
- "QA check", "New component workflow", "Doc page template", "Generated screens", "Figma is the source of truth", "Custom components": `.claude/rules/ref-ingest.md`; "DEW vs. Scaffold": `.claude/rules/ref-scaffold.md`.
- "BDBSA domain research" and the confirmed data model: `.claude/rules/ref-domain.md`.
- "User roles" and the role-access matrix: `.claude/rules/ref-roles.md`.

## Decision log

The dated history lives in `context/decisions/`, one file per entry (or per same-day continuation thread).
It is not loaded into every session: read `context/decisions/INDEX.md` (generated, one line per decision)
or grep the folder when a task needs history. Still append-only (CONTRACTS.md 5.1): a new decision is a new
file (`npm run decision:new -- --title "..."`), the index is rebuilt from the files (`npm run context:index`),
and nothing is ever appended to this file as a dated entry.
