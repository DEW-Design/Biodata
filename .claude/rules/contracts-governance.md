---
paths:
  - "/CONTRACTS.md"
  - "/contracts/**"
  - "/scripts/**"
  - "/.github/**"
  - ".claude/settings.json"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: governance

Changing the contracts, overrides, audit and the checks themselves. Full text and numbering: CONTRACTS.md.

### §9.1 Overrides

A clause may be overridden only by an explicit, named instruction from the designer (§0.1). An override
is scoped to the task, logged in `context/decisions/` (indexed in `context/decisions/INDEX.md`), and for component
creation recorded in `contracts/overrides.json` (§1.4).

### §9.2 The override register

`contracts/overrides.json` lists every authorised new component: `id`, `component`, `designer`, `date`,
`reason`, `approvedBy`, `status` (`active`, `promoted`, `retired`), and `reviewBy` (a date). It is
reviewed in the audit.

- `reviewBy` is a real deadline, not a note: `npm run check:contracts` compares it against today on
  every run - locally, on every pull request, and on the scheduled weekday run - so an override starts
  failing the day after `reviewBy` passes, with nobody having to remember to look. Renew it with a new
  `reviewBy`, or retire it (`status: "retired"`); it MUST NOT be left overdue.
- **Enforcement:** `AUTO §1.4b`.

### §9.3 The audit

`npm run audit` writes `audit/audit-YYYY-MM-DD.md`. It compares this branch with `main` and reports:
what happened on main, what is local only, contract-check results, new or changed components with their
override status, duplicate components, open `<Gap>` markers, token and utility changes, added and removed
routes, changes to the contract files themselves, and the verdict. It runs at the end of every working
day and on a schedule in CI (`.github/workflows/design-system-audit.yml`).

### §9.4 Guarding the guard

A change to `CONTRACTS.md`, `contracts/*.json`, or `scripts/check-contracts.mjs`, including updating the
baseline or inventory, is itself flagged in the audit. Loosening a rule, raising a baseline count, or
removing a clause MUST be an explicit designer decision recorded in `context/decisions/`.
