# 2026-09-29 - colour is now a contract, with an automatic checker, and a new `/design-consistency`

- **Sept 29 2026: colour is now a contract, with an automatic checker, and a new `/design-consistency`
  skill, per direct instruction ("Figma is the source of truth... you cannot invent new colours...
  can we please also have a Colour QA checker... build a skill called /design-consistency that runs
  all QA checks").**
  - **`contracts/figma-colours.json` (new)** is the flattened reference every check below reads from -
    the real "DS - Foundations" Colors page (`llQ4DndM7U0la4qg6MttC5`, node `5225:371288`) and
    Gradients page (`1525:272676`), pulled via the Figma MCP the same session as the cross-check
    logged above: every primitive step for gray, brand, error, warning, success, and Seagrass Green
    (already ingested as `--color-accent-*`), the base black/white, and the eight semantic text/
    background tokens. Flinders Violet and Horizon Blue are recorded with `cssVar: null` - documented
    in Figma, not ingested, a designer decision (see the entry above), not something this checker
    treats as a violation either way.
  - **CONTRACTS.md §2.1 gained two new sub-clauses and two new enforcement tags** (a tightening,
    flagged in the next audit under §9.4): §2.1c, every `--color-*` primitive in `app/globals.css`
    must match `contracts/figma-colours.json` exactly, hard, never ratcheted (a primitive is either
    the real Figma value or it's wrong - no legitimate "existing debt" tier for the system's own
    declared source of truth drifting from its source). §2.1d, a hardcoded colour literal matching
    nothing in that file at all was invented, not just mis-placed - a harder violation than the
    existing §2.1b ("hardcoded a real token's value inline"), ratcheted like every other pre-existing
    debt rule so it doesn't fail the whole build on day one.
  - **`scripts/check-contracts.mjs` implements both**, wired into the existing `npm run check:contracts`
    (already in `.github/workflows/design-system-audit.yml` and CONTRACTS §0.6's done-checklist, so
    no new npm script or CI step was needed): `checkPrimitiveDrift()` regexes every `--color-<family>-
    <step>` in `app/globals.css` against the JSON reference (hard, `runChecks()` always includes it);
    a new `2.1d` entry in the existing `ratchetRules` array extracts every hex/`rgb()`/`rgba()`
    literal per line (`coloursInLine()`, alpha ignored) and flags any that don't resolve to a hex in
    the flattened `FIGMA_HEX_SET` - reusing the exact same baseline/improvement machinery every other
    ratchet rule already goes through, so `--update-baseline` and the audit's own "changes to the
    contract files are flagged" rule (§9.4) both already cover it with no new code.
  - **`components/foundations/payment-icons/**` (third-party payment-brand logo SVGs - Visa,
    Mastercard, PayPal, ...) added to the scan-skip list, for every colour rule, not just the new
    ones.** Their hardcoded hex is each brand's own trademark, required exact - not a DEW colour
    choice, so flagging it as "invented" (or even "hardcoded instead of tokenised") is a category
    error. This dropped 52 files' worth of pre-existing §2.1b ratchet debt (177 lines) that was never
    honestly "ours to fix" in the first place, same tier as the existing `/proto` exemption.
  - **First real run found 12 violations; 2 were today's own sibling-grep miss, fixed on sight** (the
    same class of fix CONTRACTS §0.6 item 5 already requires): `app/(docs)/primitives/colours/page.tsx`
    and `app/(docs)/components/tooltip/page.tsx`'s "Token anatomy" table both hardcode a documentation
    copy of gray-950's hex as a plain string - both still said `#0C111D`, the value just replaced in
    the same session's colour cross-check above. Fixed to `#1A1715` in both. `tsc`, `eslint
    --max-warnings=0`, and `check:contracts` all clean after.
  - **The remaining 10 are real, pre-existing debt, locked into the ratchet baseline honestly** (not
    fixed - a separate remediation task, out of scope for "build the checker"): a purple `#7F56D9`
    on `components/application/tree-view/tree-view-utils.ts` and `app/(docs)/components/avatar/
    page.tsx` (not a real DEW colour anywhere in the Foundations file - worth a look), `select/
    page.tsx`'s 3 arbitrary hexes, `textarea.tsx`'s 2 (a disabled-state border/text pair, `#D5D7DA`/
    `#373A41` - close to but not exactly gray tokens), `app/pages/biodata-home/page.tsx`'s 15 (mostly
    the hero photo's rgba scrim and its decorative gradient overlays), `primitives/shadows/page.tsx`'s
    7 (shadow rgba values - `rgba(16,24,40,X)`, a plausible-but-unconfirmed shadow colour, not a
    surface colour, worth checking against Figma's own shadow tokens separately), `ContextualConfigPanel.tsx`'s
    2 (also shadow rgba), and `test-page/page.tsx`'s 1. `projects`/`projectsv2` (the two long-flagged
    stale drafts) also carry pre-existing hits, left alone per that standing precedent.
  - **`.claude/skills/design-consistency/SKILL.md` (new)** - a project-scoped skill invokable as
    `/design-consistency`. Orchestrates, in order: the mechanical checks (`tsc`, `eslint`,
    `check:contracts`, which now covers colour), the colour/gradient fidelity check (re-pull
    `contracts/figma-colours.json` via the Figma MCP only when asked, otherwise trust it), the type-
    hierarchy sweep (CONTRACTS §2.9's own three-source order, invoking `/emil-typography`/`/emil-
    design-foundations`), and a live computed-style measurement pass (the same disposable-Playwright-
    in-`/tmp` pattern used for both audits above - no permanent dependency added). States its own
    boundary explicitly: fix a Figma-confirmed primitive drift and its doc-copy siblings on sight,
    report anything bigger (a new palette, a sitewide weight change, a shared-component edit) rather
    than applying it, per CONTRACTS §0.4/§0.7 - the same boundary every pass in this file already
    respects, now written down once instead of re-derived per session.
  - Verified: `tsc --noEmit`, `eslint --max-warnings=0` on every touched file, and `npm run
    check:contracts` all clean; `--update-baseline` run once to lock in the honest starting `2.1d`
    debt and the legitimate `2.1a`/`2.1b` drops from the payment-icons exemption (an audited act,
    logged here per §9.4). Not committed.