---
paths:
  - "/components/**"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: components

Creating or changing a component: override, duplicates, ingest hygiene, ambient leaks. Full text and numbering: CONTRACTS.md.

### §1.4 A new component is a designer override, with checks and balances

Creating a component is the one act that changes the design system itself. It MUST NOT happen as a
side effect of building a screen.

1. **Who:** only the designer may authorise it, explicitly, for that component.
2. **Record:** before the component file is committed, an entry MUST exist in
   `contracts/overrides.json` with `component` (path), `designer`, `date`, `reason` (why no existing
   component works, and which were checked), `approvedBy`, and `reviewBy` (a date; §1.4b, §9.2). Use
   `npm run contracts:override`.
3. **Inventory:** the file is added to `contracts/component-inventory.json` by
   `npm run check:contracts -- --update-baseline`. Doing that is itself an audited act (§9.4).
4. **No twin:** it MUST NOT duplicate the job of an existing component (§1.7).
5. **Tier:** it starts in `components/custom/**` until promoted (a move, not a rebuild).
6. **Audit:** it is listed in the next audit report under "New or changed components" with its override
   status. A component without an override record is flagged **VIOLATION**.

- **Enforcement:** `AUTO §1.4` (a component file not in the inventory and without an override fails the
  check), `AUTO §1.4b` (an override with no `reviewBy`, or whose `reviewBy` has passed - checked against
  today, on every run, not just at creation), `AUDIT`.

### §1.7 No duplicates

Two components that do the same job (a `Textarea` in `custom/` beside `TextArea` in `base/`) are a defect.
The audit lists same-named components across tiers. A duplicate MUST be resolved by choosing one and
migrating every caller, not by keeping both.

- **Enforcement:** `AUDIT`.

### §1.8 Ingest hygiene

After any Untitled UI CLI run, `git status` and `git diff` MUST be reviewed before anything else: the CLI
has silently reverted eight already-audited files before. A new ingest is documented (Playground, API
table from the real interface, Usage, Figma or an honest "not linked yet") and slotted alphabetically
(§5.3), then passes §0.6.

### §2.7 No ambient leaks

A component MUST render identically inside and outside `.prose-doc`. Headings and paragraphs inside a
component carry explicit `!` overrides where the doc-site globals would otherwise leak in.
