---
name: design-consistency
description: Runs every design-system QA check on this repo end to end - typography hierarchy (CONTRACTS.md 2.9), colour and gradient fidelity against the real Figma DS - Foundations file (2.1), the shell and form-pattern contracts, and a live computed-style sweep - and reports deviations as a dated audit file plus a CONTEXT.md entry. Use when asked to audit, QA, cross-check or sanity-check the design system's own consistency (typography, colour, tokens, component patterns) across the webapp, or when told to run /design-consistency directly. Triggers on: design consistency, design QA, colour audit, color audit, typography audit, type hierarchy, token drift, Figma cross-check, design system audit, style audit, contract check.
---

# Design consistency

A repeatable, evidence-based sweep of this repo's own design system against its two sources of truth -
the shipped code and the real Figma "DS - Foundations" file - following CONTRACTS.md §2.9 (type) and
§2.1 (colour) exactly. It **finds and reports deviations**; it does not silently fix everything it finds.
The one class of fix this skill applies on sight, per CONTRACTS' own established convention, is a
primitive token that has drifted from a Figma value already recorded in `contracts/figma-colours.json`
(a `--color-*` scale step, an obviously-wrong copy of one in a doc page). Anything bigger - a new named
colour family, a heading-weight rule applied sitewide, a component change - is proposed and waits for the
designer, the same §0.4/§0.7 boundary every other pass in this codebase already respects.

Read `/CONTRACTS.md` and the "Type hierarchy" (§2.9) and "Tokens only" (§2.1) clauses specifically before
starting - this skill enforces those, it doesn't restate them.

## What this checks, in order

1. **Mechanical, fast, always run first.**
   - `npx tsc --noEmit`
   - `npx eslint <touched files, or the whole repo if none yet>  --max-warnings=0`
   - `npm run check:contracts` - this already runs the colour checks (§2.1c primitive drift, §2.1d
     invented-colour ratchet, §2.1a/b), the shell contracts, the form pattern, and the component
     inventory. A clean run here is necessary, not sufficient - it catches static drift, not what
     renders.
2. **Colour and gradient fidelity against Figma (CONTRACTS §2.1).**
   - The reference is `contracts/figma-colours.json` - every primitive scale (`gray`, `brand`,
     `error`, `warning`, `success`, `seagrassGreen`) plus the semantic text/background tokens, pulled
     from the real "DS - Foundations" file (`llQ4DndM7U0la4qg6MttC5`): Colors is node `5225:371288`,
     Gradients is node `1525:272676`. Two more scales are documented there but not yet ingested -
     `flindersViolet`, `horizonBlue` - listed with `cssVar: null`; do not add them to `app/globals.css`
     as part of a QA pass, only flag that they exist and are unused.
   - `npm run check:contracts` already re-checks `app/globals.css`'s primitives against this file
     (§2.1c, hard) and scans product code for colour literals that match nothing in it at all (§2.1d,
     ratcheted). Re-running that script IS the static half of this check - don't re-derive it by hand.
   - If asked to re-pull the Figma reference (the Foundations file may have changed): use the Figma
     MCP tools directly - `get_variable_defs` on both node ids above is the fast, exact path (token
     name to hex, no eyeballing); fall back to `get_design_context`/`get_screenshot` on a specific row
     only when `get_variable_defs` doesn't bind a variable to a swatch (it happens - see the `success`
     step 200 case in `contracts/figma-colours.json`'s own history, resolved by screenshotting just
     that row). Update `contracts/figma-colours.json` and its `source.fetched` date; changing that
     file is itself an audited act (CONTRACTS §9.4) - say so in the report.
   - **The live half:** a hardcoded/arbitrary colour can still slip past both static checks (an
     arbitrary Tailwind value like `bg-[#123456]`, or a component whose class silently resolves to
     the wrong colour at runtime - the exact shape of the `--color-gray-950` bug this skill exists to
     catch faster next time). Spot-check computed `background-color`/`color`/`border-color` on a
     handful of real screens (see "Live measurement" below) against the same `figma-colours.json` set.
3. **Type hierarchy (CONTRACTS §2.9).**
   - Read `app/(docs)/primitives/typography/page.tsx` for the documented scale, then grep every
     `text-*`/`font-*`/`tracking-*`/`uppercase`/`tabular-nums`/`text-balance` class in
     `components/base/**`, `components/application/**`, and `app/pages/**` for the role being audited
     (or every role, for a full sweep).
   - For each role (page title, section/card heading, label, hint, table header/cell, badge, button,
     tab, modal/alert/toast title and description, eyebrow, KPI value, empty state, record label/value
     row - see `audit/type-audit-2026-09-29.md` for the full role list this repo has already used) -
     find every distinct size/weight/line-height/colour combination in play for that one role.
     **More than one combination for the same role is the finding** - CONTRACTS §2.9 requires one role,
     one treatment, everywhere, sourced first from the design system, then from an existing sibling
     pattern, and only then from `/emil-typography`/`/emil-design-foundations` if both are silent.
   - Invoke `/emil-typography` and `/emil-design-foundations` (they're loaded automatically via the
     Skill tool) as part of judging what's found - not as a separate, disconnected pass.

## Live measurement

Static grep tells you what a component's class list *says*; it doesn't tell you what a browser
*renders* - the whole reason `--color-gray-950` and the dead `text-md` gap both slipped through prior
static passes. This repo has no Playwright dependency committed on purpose (see CONTEXT.md's own
"Playwright installed for the session only, removed after" convention throughout) - follow the same
pattern:

```bash
mkdir -p /tmp/design-consistency && cd /tmp/design-consistency
npm init -y >/dev/null && npm i playwright-core >/dev/null 2>&1
# chromium is already cached at ~/Library/Caches/ms-playwright if a prior pass installed it - check
# before re-downloading. A local dev server is usually already running on :3000; check with curl
# before starting a second one on another port.
```

Write a short script (see the shape used for `audit/type-audit-2026-09-29.md` and
`audit/colour-gradient-cross-check-2026-09-29.md` if either still exists) that:

- launches `chromium.launch()`, opens a `1600x1000` viewport context;
- visits a representative screen set covering every persona and every real shell (Home for
  registered/admin/public, Projects, a generated and a hand-built project-detail page, Explore, DLA,
  DSA, nominations, User Management, at minimum - `?userRole=` query param switches persona);
- for **colour**: `getComputedStyle` every element's `backgroundColor`/`color`/`borderColor`, convert
  to hex, and diff against the flattened `contracts/figma-colours.json` set (base + semantic +
  every primitive step) - anything not in that set is a live finding, independent of what the source
  literally says;
- for **type**: `getComputedStyle` font family/size/weight/line-height/letter-spacing/text-transform/
  color per role, grouped the same way as the static pass;
- asserts zero `pageerror`/console-error events on every page load - a console error during a QA sweep
  is itself a finding, not noise to filter out.

Remove the `/tmp` scaffold and any installed Playwright when done; `package.json` in this repo must
come back unchanged unless the designer has explicitly asked for Playwright to become a real
dependency.

## Reporting

- Write findings to `audit/design-consistency-<YYYY-MM-DD>.md` (or reuse/extend the existing dated
  type and colour audit files if the pass is scoped to just one of those two areas) - the same
  structure those two files already use: what already holds (stay silent beyond a one-line
  confirmation), a numbered conflicts list with exact `file:line` citations, and a decision table for
  anything that isn't a same-role-different-treatment mechanical fix (new palettes, contrast changes,
  anything touching a shared component used in more than a couple of places).
- Append a dated, append-only entry to `CONTEXT.md` (no em-dashes) summarising what ran, what was
  found, what was fixed on sight versus flagged, and the open decisions - CONTRACTS §0.7's "close with
  the next move," not just a dump of findings.
- Don't commit unless asked (CONTRACTS §5.2).

## Boundaries

- **Fix on sight:** a primitive that drifted from `contracts/figma-colours.json`, and every doc page
  that hardcodes a stale copy of that same value (grep the sibling files, same discipline as any other
  fix in this repo - see CONTRACTS §0.6 item 5).
- **Report, don't fix:** a same-role-different-treatment type finding that spans more than a couple of
  files (get an explicit go-ahead before a sitewide heading-weight sweep, the way the `text-md`/
  heading-weight decisions in `audit/type-audit-2026-09-29.md` were each confirmed with the designer
  before being applied).
- **Never do unasked:** ingest a new Figma-documented colour family (Flinders Violet, Horizon Blue) into
  `app/globals.css`, change a shared component's default styling, or update
  `contracts/figma-colours.json`/`contracts/baseline.json` without saying so plainly in the report -
  all three are audited acts under CONTRACTS §9.4.
