# DEW Design System - Binding Contracts

This is a code, not advice. Each clause is numbered, states what is required, what is prohibited, and
what the only exceptions are. Where a clause has an enforcement tag, a script checks it - a violation
fails `npm run check:contracts` and shows up in the daily audit (`npm run audit`).

**How to read a clause**

- **MUST / MUST NOT** are binding. "Should" does not appear in this file.
- **Enforcement:** `AUTO §x.y` means `scripts/check-contracts.mjs` fails on it. `AUDIT` means the daily
  audit report flags it. `REVIEW` means it is checked by a person or by the end-of-task checklist in §0.6.
- **Origin** names the real incident the clause came from. Every clause exists because that failure
  already shipped once.
- A task that violates a clause is **not done**, however complete it otherwise looks. Fix it or say,
  explicitly, which clause is being overridden and why (§9).

---

## PART I - CONDUCT (applies to every task, human or agent)

### §0.1 Precedence

1. `CONTRACTS.md` is binding. The dated history of how the system got here lives in
   `context/decisions/` (one file per entry, indexed in `context/decisions/INDEX.md`); where the two disagree, this
   file wins and the relevant decision file is corrected in the same task.
2. An explicit instruction from the designer in the current session may override a clause. When that
   happens the agent MUST (a) name the clause being overridden, (b) log the override in a new dated
   file under `context/decisions/` (indexed in `context/decisions/INDEX.md`), and (c) if the clause is §1.4 or §9,
   record it in `contracts/overrides.json`. One override is never a precedent for the next task.
3. Nothing in `CONTEXT.md` or `context/decisions/` may be used to justify a violation of this file.

### §0.2 No assumption - verify before use

Before using any component, prop, token, utility class, icon, route, nav key, config key or data field,
confirm it exists by looking (grep the source, the compiled CSS, the type definition). "It looks like a
real Tailwind class", "Untitled UI ships it", "it worked on the other page" are not verification.

- MUST NOT use a class that is not defined in `app/globals.css` (see §2.1).
- MUST NOT pass a prop that is not in the component's real interface.
- MUST NOT import an icon, component or helper without confirming the export exists.
- **Origin:** `bg-quaternary`, `bg-border-secondary`, `text-md`, `selected:bg-secondary`, and a dozen more
  plausible-looking classes shipped as silent no-ops.
- **Enforcement:** `AUTO §2.1` (known-dead classes), `tsc`, `REVIEW`.

### §0.3 No fabrication

MUST NOT invent: Figma links or node ids, icons or image assets, product copy presented as sourced,
sample data presented as real, organisation names, DOIs, permit numbers, people. Where the truth is
missing, render an honest marker (`?` per §1.2, "Not provided" per §2.3) or ask.

- Placeholder people are Olivia Wyatt, Phoenix Baker, Lana Steiner, Maya Dewitt only. Never the current
  user's real name or email.
- Real organisations come from the BDBSA research in `.claude/rules/ref-domain.md` (BirdLife Australia, Birds SA,
  South Australian Museum, ...). Never invent a partner.
- Sample data MUST NOT describe its own bugs in a field the UI renders.
- **Origin:** a Figma link fabricated for a component, a Bell icon used where Figma drew a check-circle.
- **Enforcement:** `REVIEW`, `AUDIT` (new external URLs are listed).

### §0.4 Ask, do not decide

If scope, direction, persona, or which of two reasonable readings is meant is unclear, ask one precise
question. A question is cheaper than a wrong build. MUST NOT decide unilaterally on: deleting an explored
option, changing a persona's access, replacing a component, or resolving a difference between two
sources of truth (Figma vs code, main vs local).

### §0.5 Honest reporting

Report what happened: failing checks with their output, skipped steps as skipped, known gaps as gaps.
MUST NOT describe work as verified unless it was run. MUST NOT bury a limitation.

### §0.6 Definition of done (end-of-task checklist)

A change to `components/**`, a page, a token, or a `/test-*` screen is done only when all of these ran:

1. `npx tsc --noEmit` clean.
2. `npx eslint` clean on every touched file.
3. `npm run check:contracts` passes.
4. A live browser pass (Playwright or the browser tool) over every affected screen, all affected
   personas, zero console errors, computed styles checked where styling was the point.
5. A sibling grep: the same bug pattern searched for in every file that shares the pattern.
6. A dated file created with `npm run decision:new` under `context/decisions/` (append-only, no
   em-dashes). The index is generated (`npm run context:index`), never edited by hand.
7. `git status` after any CLI ingest: a CLI run can silently revert already-fixed files.
8. Typography QA (§2.9), on any change that adds or changes visible text: `/emil-typography` and
   `/emil-design-foundations` ran, after the type was checked against the design system and the
   patterns already on the web app. The report names what was checked and what was measured.
9. Behaviour in its home (§1.10): any behaviour another screen could want (a scrollbar, a dismiss, a cut, a drag) was
   looked for in `components/**` first and, if it is new, built there with the designer's override, not in a
   screen, in `app/pages/_shared` or in the layout. The report says where each behaviour lives.

- **Enforcement:** `REVIEW` (item 3 is `AUTO`).

### §0.7 Proactive, not reactive

Anticipate what the designer will need; do not wait to be told or corrected.

1. **Read the brief against what is already decided before planning.** The role-access matrix
   (`config/role-access.config.ts`), `CONTEXT.md`, these contracts and existing patterns are applied
   without being reminded: who can see the feature, which shell and pattern it uses, which components
   exist, which data is real.
2. **Surface before it is found.** A plan or report names, up front: conflicts between sources (a
   wireframe vs the role model, the IA vs the data), fabricated or placeholder content that would need
   replacing (§0.3), missing states, knock-on effects on other screens and personas, and build risks
   (static export, hydration, performance).
3. **Check your own output against these contracts before presenting it.** A violation the designer
   catches in review is a failure of this clause, even when it is then fixed.
4. **Close with the next move.** Every task ends with the open decisions and the recommended next step,
   not only a summary of what changed.

- **Boundary with §0.4:** proactive means raising, recommending, and fixing what is unambiguously inside
  the approved scope (a sibling bug, a missing guard, a stale doc line). It never means building beyond
  the approved scope: anything out of bounds is proposed with a recommendation and waits for approval.
- **Origin:** a User Management brief where the designer had to point out that the feature is
  BioData Admin only, a fact already in the role model and `CONTEXT.md`; and repeated rounds where
  contract violations were caught by the designer in review instead of being raised first.
- **Enforcement:** `REVIEW`.

### §0.8 Promote a repeated fix

The second time the same underlying bug is fixed for the same reason - two `CONTEXT.md`/decision-log
entries naming the same cause, not just a similar symptom - it MUST NOT be fixed by hand a third time.
The task that fixes it the second time writes or extends an `AUTO` check for it in
`scripts/check-contracts.mjs` instead, so a machine catches it from then on rather than relying on it
being remembered.

- MUST NOT close a task with "fixed again" for a bug already logged as fixed once before, with no
  `AUTO` check added or extended in the same task.
- A rule that cannot be checked mechanically at all (a layout judgement, a tone-of-voice call) stays
  `REVIEW`, but is still named as a recurring pattern so the next person checking it knows to look for it.
- **Origin:** `MultiSelect` clearing its selection on Escape was logged as fixed six times before it
  became `AUTO §1.9a` (§1.9's own origin line).
- **Enforcement:** `REVIEW`.

### §0.9 Borrow and reuse patterns from existing pages

Before building a screen, a section or a control, find the closest page that already does the same job and reuse
its pattern: the same layout, the same components, the same arrangement of information, the same behaviour. The
product is one system; a new screen is the existing patterns put to a new use, not a new design.

1. **Look first, in this order:** the component in `components/**` and its doc page; the pattern page under
   `/patterns` and the clauses in §3 and §4; then a sibling screen that has the same shape (a record page beside
   another record page, a list beside another list, a form beside another form). Name what was borrowed.
2. **Reuse, then extend.** If the existing pattern is close, use it as it is; if it needs a second behaviour, add
   an opt-in prop (§1.6) so every screen gains it. MUST NOT copy it, or draw a lookalike beside it.
3. **A new arrangement needs a reason.** MUST NOT introduce a layout no other page uses (a master and detail list inside a
   tab, a second kind of card, a one-off table) when an existing one does the job. A real difference is named in the
   page's header comment and, when it is new for the product, proposed to the designer (§0.4) first.
4. **Where two pages that do the same job differ, the screen being touched is brought in line** (the sibling grep,
   §0.6 item 5), not the other way round, unless the designer decides otherwise.

- **Origin:** the user record's Roles and permissions tab was built as a list of roles with a detail panel for the chosen
  one, a layout no other record page uses, and it repeated the role's name, count and link three times; the other record
  pages already put a record's own facts on an Overview tab and the things it relates to on a tab each. The designer: "Borrow
  and reuse patterns from existing pages" (6 Oct 2026).
- **Enforcement:** `REVIEW` (the end-of-task check names the page borrowed from; §0.7 item 3).

### §0.10 Explore design-first

An exploration (a new screen, a layout option, a lab, a restyle) starts from the design principles, not from a layout. The principles are `.claude/rules/ref-principles.md`, in full with the designer's words at
`/principles`; they decide what no clause covers, and never override one (§0.1). Before anything is built the agent MUST:

1. **Name the job and the principles.** Who is doing what, on which screen, with which role, in one sentence; and the two or three principles that bear on it, and where they pull apart. Where they do and the
   repo cannot settle it, ask one precise question (§0.4) before building.
2. **Stand on the ground:** walk the states and the roles (§0.7, `ref-shell.md`), find the closest existing page (§0.9), and use the components (§1.1) and the content (§0.3, §2.15) that really exist.
3. **Make options, not one guess,** where the direction is open: real components, in a lab behind `LayoutOptionSwitcher` (§4.4), each saying which principle it favours.
4. **Judge it against the principles before showing it,** with the designer's standing tests: where I came from, what to do here and how to get back; every word from its source; every state; and a measured pass in a
   browser (§0.6 item 4). Say what was measured and what was not (§0.5).
5. **Record why,** in the principle's terms, when the designer chooses (§5.1); and when the same fix is made twice, make it a check (§0.8). The details that come out of it are added to `/principles/craft`.

- **Origin:** the designer, after the principles had been scattered across the cognitive-load list in `ref-shell.md`, the contracts (which say what to do and not why) and one audit, none revisited since the end of
  September: "let's start to approach explorations with design-first principles" (23 Oct 2026).
- **Enforcement:** `REVIEW` (the report names the principles an exploration was built from and the option each favours; §0.7 item 3). The principles are a draft for the designer to confirm.

---

## PART II - COMPONENTS

### §1.1 One source of components

UI is built only from `components/base/**`, `components/application/**`, `components/foundations/**`,
`components/marketing/**`, and (with its own status, §1.4) `components/custom/**`. Scaffold tooling
(`components/scaffold/**`) may only operate or wrap a demonstration, never appear as product UI.

### §1.2 No match, no substitute: mark it `?`

When no existing component does the job, MUST render the shared gap marker `<Gap>`
(`components/scaffold/gap.tsx`): a visible dashed `?` box at the exact position, naming what is missing.

- MUST NOT fake it with a lookalike built from a different component.
- MUST NOT silently omit it.
- MUST NOT patch a real component to cover it.
- A gap is logged where it is used (a mapping/gap table on `/test-*` screens) and appears in the daily
  audit's open-gaps list until a real component replaces it.
- **Exception (structural shell):** a missing pattern that organises a whole screen (an accordion wrapping
  every section) is composed from real tokens instead of `?`-blocking everything inside it, and logged as
  "composed, not a real component".
- **Exception (plain text):** non-interactive text is text; it is not a component gap.
- **Origin:** `/test-site-details` faked Radio and Textarea with lookalikes for weeks.
- **Enforcement:** `AUDIT` (open `<Gap>` list), `REVIEW`.

### §1.3 Flow-through

When a gap is resolved by a new component, or a component changes (a prop, a token, a bug fix), every
screen that used the placeholder or the component MUST be updated in the same task: the placeholder
swapped, the gap table and mapping table updated, the relevant `context/decisions/` entry corrected (or
a new one added if there wasn't one).

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

### §1.5 The DEW / Scaffold line

Role, not import path, decides which side an element is on: the thing being demonstrated is DEW; the
thing operating or wrapping the demonstration is Scaffold.

- MUST NOT patch a real component under `components/base/**` to serve a doc-only or Scaffold-only need.
- MUST NOT build a Scaffold control from a real DEW component.
- MUST NOT add `font-barlow` to Scaffold text, or remove it from a DEW component (§2.2).

### §1.6 Extend, do not fork

A component that needs a second behaviour gets an additive, opt-in prop whose default leaves every
existing caller unchanged (`Accordion variant`, `AlertFullWidth contained`, `Table size="xs"`). MUST NOT
copy a component to change it.

- **Exception (designer, 23 Oct 2026):** the hit area (§2.16) is on by default in every component that carries it. It changes what a press hits and nothing about how a control looks or sits,
  and the instruction was that every screen has it.

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

### §1.9 Behaviour patterns flow through every component

A component behaves as the WAI-ARIA Authoring Practices pattern for its role (select and listbox,
combobox, menu, dialog and popover, tabs, tree, table). react-aria supplies that pattern; a component
MUST NOT ship with a library default that breaks it, and MUST NOT work around one at a call site. The
fix goes into the component, once, so every consumer gets it (§1.3).

1. **Escape closes and cancels. It never changes a committed value.** A popover, menu, dialog or
   listbox closes on Escape; it does not clear a selection or a field's value.
2. **Selection applies live.** A multiple selection changes as each item is toggled; closing keeps what
   was chosen. Nothing is discarded by closing, and there is no hidden Apply.
3. **Keyboard is complete.** Tab reaches every control in a logical order, Arrow keys move inside a
   list, Enter or Space selects or activates, and focus returns to the trigger when an overlay closes.
4. **Every state is real:** default, hover, focus-visible, pressed, disabled, invalid, empty, loading.
5. **A behaviour change is tested by keyboard, not just by mouse** (Tab, Arrows, Enter, Space, Escape) in
   a live browser on every screen that uses the component, as part of §0.6 item 4.

- **Origin:** `MultiSelect` cleared its whole selection on Escape (react-aria's `clearSelection` default),
  logged as a known gap six times before it was fixed; `Tab`'s `badge={0}` rendered a bare "0".
- **Enforcement:** `AUTO §1.9a` (a multiple-selection `ListBox` in `components/**` without
  `escapeKeyBehavior`), `REVIEW` for the rest.

---

### §1.10 Behaviour is a component: it is built in `components/**`

A behaviour that more than one screen has, or could have, belongs to the control or element it governs, so it is a component (or a part of one) and is built like one: a scrollbar, a way of dismissing, a way of cutting text, a
drag, a hit area, a focus ring, a way of opening. Where it is built decides whether the contracts can see it. The designer's override (1.4), the inventory, the duplicate check (1.7), the doc page (5.3) and the behaviour patterns
(1.9) all start from `components/**`, so a behaviour written in a screen, in `app/pages/_shared`, in an `app/_*` folder or in the root layout is invisible to every one of them, and gets built twice.

- **MUST** build it in `components/**` (tier `custom` until it is promoted, 1.4), with the designer's override and its doc page. **MUST NOT** build it in a screen, in `app/pages/_shared`, in an `app/_*` folder or in the layout, and
  MUST NOT write it inline in a screen file (an effect that listens on the document, a hook that measures): a screen takes a component's behaviour by a prop or an attribute. What a screen does with its own data stays in the screen.
- **Look first, in `components/**`** (0.9), before building a behaviour; where one is close, extend it with an opt-in prop (1.6) and do not write a second.
- **The root layout renders components from `components/**` only.**
- **Open (23 Oct 2026), found when this clause was written, each for the designer's decision (0.4):** `DrawnScrollbars` (`app/_scrollbars`, the one scrollbar of 2.17, mounted from the layout); `ScrollFade`, `useListToggle` and
  `ChunkHeading` (`app/pages/_shared/map-search`); and the parks step's dismiss on an outside press, written inline in `observations-search.tsx`. **Two implementations of one behaviour (1.7):** `FittedText`
  (`app/pages/_shared/fitted-text.tsx`, text cut at a word or in the middle of a file name, measured on a canvas) and `Select`'s `truncateAtWords` and `labelEnd` (the same two strategies, in CSS), both built on 23 Oct 2026. Each is
  listed in the check as open until it is moved into `components/**` with an override, or merged into the one that stays.
- **Origin:** the one scrollbar (2.17) was built in `app/_scrollbars` and mounted from the layout, so nothing in the contracts saw a component being made; and the same day text was cut by a strategy twice, in `FittedText` and
  in `Select`, because the second was built without looking in `components/**` or `_shared`. The designer: "component behaviour falls under components. We need to make sure this is factored in. That's a gap" (23 Oct 2026).
- **Enforcement:** `AUTO §1.10` (the root layout renders a component built under `app/`, other than the open one named in the check), `REVIEW` for the rest (0.6 item 9): which inline effect or `_shared` hook is a behaviour another
  screen could want is a judgement, not a name a script can find, so it is named here as a recurring pattern and is the first thing to check in any new `useEffect` that listens on the document.

## PART III - STYLE

### §2.1 Tokens only

Colour, spacing, radius, shadow and type come from the `--ui-*` layer in `app/globals.css`.

- MUST NOT hard-code hex, rgb or rgba in product code.
- MUST NOT use a utility that is not defined. Known-dead and therefore prohibited: `text-md`,
  `bg-quaternary`, `bg-border-secondary`, `border-secondary_hover`, `border-l-brand-solid`,
  `border-error-subtle`, `selected:` variants, `ring-offset-bg-primary`, `divide-secondary` (a divider takes
  `border-t border-secondary` instead). Add the utility to `globals.css`
  first if it is genuinely needed.
- **Every colour primitive traces to Figma, not invention.** `app/globals.css`'s `--color-*` scales
  MUST match the real "DS - Foundations" Figma file's Colors page (`llQ4DndM7U0la4qg6MttC5`, node
  `5225:371288`) exactly, recorded in `contracts/figma-colours.json`. A primitive that drifts from
  that reference is fixed at the token the moment it's found, not left - `--color-gray-950` carried
  Untitled UI's stock value for weeks with no real value to check it against; fixed 29 Sept 2026 once
  one existed, and both doc pages that had copied its old hex as documentation text were fixed in the
  same sibling grep. MUST NOT invent a hex value, approximate one by eye, or bring in a whole new
  named palette Figma documents but nothing yet uses (e.g. Flinders Violet, Horizon Blue) as a side
  effect of building a screen - that's a designer decision, same tier as a new component (§1.4).
- **A hardcoded colour that matches nothing in `contracts/figma-colours.json` at all was invented, not
  just mis-placed** - a harder violation than hardcoding a real token's value inline. Exempt:
  `components/foundations/payment-icons/**`, third-party payment-brand logos whose hex is each
  brand's own trademark, not a DEW colour choice.
- **Enforcement:** `AUTO §2.1a` (known-dead classes), `AUTO §2.1b` (hard-coded colour, ratcheted
  against `contracts/baseline.json`: existing debt may not grow), `AUTO §2.1c` (a primitive drifted
  from `contracts/figma-colours.json` - hard, never ratcheted), `AUTO §2.1d` (a colour literal
  matching nothing in `contracts/figma-colours.json` - ratcheted).

### §2.2 Typefaces

Product UI, generated screens and every DEW component are Barlow. Doc-site chrome and Scaffold controls
are Geist. Portaled content (Modal, Popover, Dropdown menu, Tooltip) MUST carry `font-barlow` itself. The
biodata-home hero wordmark (Fredoka) is the one page-scoped exception.

### §2.3 Copy and punctuation

- MUST NOT use em-dashes in code, comments, doc copy or component copy. Use a hyphen.
- MUST NOT use arrow characters (`->`, the unicode arrows) in place of an icon. Use the `Button` icon
  props (`iconLeading`, `iconTrailing`) with a real icon.
- Any copy that can wrap to two or more lines carries `text-balance`.
- An empty value is omitted or written "Not provided", never a stray `-`.
- **MUST NOT use a dot to separate pieces of text:** the middle dot (`·`, U+00B7, `&middot;`) never goes between a count and
  its type ("1 record · Individual"), a family and a group, an organisation and a project, a name and a date, a code and a
  name, or the parts of an eyebrow, a meta line, a label or a status. This is about text; a bullet that masks a password
  or marks a list item is not a separator. **What goes there instead depends on the kind of text (designer, 25 Oct 2026):**
  attributes of one thing take a comma ("1 record, Individual", "Phalangeridae, Mammal"), and a colon where the second part is
  itself a list ("2 records: Population, Individual"); an identifier before its name, and a coded value before its meaning,
  take a hyphen ("BD-5137 - Flinders Ranges Reptile Atlas", "3 - Within 1 km"); an eyebrow is words ("Add occurrence", "Edit
  overview"); a status after its subject takes a comma ("Not added, something went wrong on our side"); a label before its
  value takes a colon ("Last upload: 12 Oct 2026"); a qualifier takes parentheses ("-35.029, 138.719 (GDA2020)"); two things
  side by side need no mark, the gap between them does it. Where two of these fit, the first named is used. Never the dot.
- **Origin:** the species card read "1 record · Individual" and the project page, Explore, the reports, the
  record trees and the forms were full of the same dot. The designer: "let's never add the dot to separate text. Let's
  please tweak this across the webapp." (25 Oct 2026).
- **Enforcement:** `AUTO §2.3` (em-dashes and arrow characters, ratcheted), `AUTO §2.3c` (a middle dot in code that is not a
  comment, ratcheted: all 157 uses on 25 Oct 2026 were converted the same day, so its baseline in `contracts/baseline.json` is zero
  and any dot fails). Labs under `app/proto` are outside the scan (5.4) and keep theirs until they are folded into a page.

### §2.4 Icons

One icon per concept. MUST NOT place two icons side by side for one label. Use the exact glyph Figma
draws; never default to whichever icon is already imported.

### §2.5 Figma is the source of truth

Wherever a frame exists it wins on colour, spacing and state; every demonstrated variant is checked
against it and undocumented variants are trimmed (kept in the API table, not demonstrated). Figma wins on
styling, never on scope or structure. A lo-fi wireframe or screenshot fixes content and flow only; it is
re-fitted into the real three-column shell and real components, never shipped as drawn.

- MUST re-fetch the exact node (`get_design_context`) before asserting anything about it; metadata alone
  never gives colour, spacing or which variant.

### §2.6 External references

A reference (Mobbin, another product) supplies interaction and IA ideas, never colour, spacing, radius,
type, or component replacements. Workflow: ingest, extract patterns, propose a list and stop, map to our
components, build, QA, document.

### §2.7 No ambient leaks

A component MUST render identically inside and outside `.prose-doc`. Headings and paragraphs inside a
component carry explicit `!` overrides where the doc-site globals would otherwise leak in.

### §2.8 Floating panels never overlap

Two floating elements on the same surface (map controls, a summary card, a map key, a search card,
the map's scale bar and attribution) MUST NOT cover each other, at any window size.

- MUST lay out floating panels that share a surface in one layout (a flex column or row), not
  position each one on its own with offsets that only work at one size.
- A panel that can grow (a card with a photo, a results list) MUST be height-bounded by that layout
  and scroll inside itself; its primary action stays reachable.
- Where there is not room for panels side by side, they stack; they never overlap.
- **Exception:** the floating dev tools (§3.8) are draggable and are not product layout.
- **Origin:** Explore option 2's record summary card grew down over the "Species group" map key.
- **Enforcement:** `REVIEW` (a live pass measuring panel boxes at several window sizes, §0.6 item 4).

### §2.9 Type hierarchy

A correct type hierarchy is non-negotiable and is right the first time. An agent MUST NOT generate a
type layer: a size, weight, colour, case, tracking or line-height combination that no source has
already defined. Every piece of text takes its treatment from the first of these that answers, in this
order, and the order is not skipped:

1. **The design system.** The `/primitives/typography` scale and weights, the text colour tokens, and the
   text the component itself already sets (`SectionHeader.Heading`, `Badge`, `Table.Head`, `HintText`,
   `Label`). Text inside a real component is never restyled at the call site (§1.9).
2. **Patterns already on the web app.** Find the sibling that plays the same role (a popover title, a
   card heading, a field hint, a table cell, a count) and copy its classes exactly. One role has one
   treatment everywhere: the same role MUST NOT be medium in one place and semibold in another.
3. **Emil's skills.** `/emil-typography` and `/emil-design-foundations` judge the result: hierarchy
   (one focal point, everything else recedes), scale steps, weights, tabular numbers on changing
   figures, `text-balance`, line length, contrast, and sentence case.

- If all three are silent, ask one precise question (§0.4). MUST NOT invent a layer to fill the gap.
- Every change that adds or changes visible text runs both skills as part of QA (§0.6 item 8), with
  computed styles measured in a live browser (`getComputedStyle`, not the class list): family, size,
  weight, colour and contrast, tabular figures where a number changes.
- The report says which design system entry and which existing pattern each new layer was taken from.
  A layer with no source named is a violation, however good it looks.
- **Origin:** the ingestion popover's tree-card heading was medium where its sibling popover heading
  was semibold; a small "where" line sat between two larger lines and broke the hierarchy; `TextArea`
  rendered 16px beside a 14px `Input`; the typography docs and the components disagree on caption weight.
- **Enforcement:** `REVIEW` (the two skills at §0.6 item 8); `AUTO §2.1` already fails the dead `text-md`.

### §2.10 No affordance for a shortcut that isn't real

A control MUST NOT show a keyboard-shortcut hint unless that exact shortcut is wired up and does
something on the screen showing it. A hint is a promise; an unwired one is a fabrication, same tier as
a fake icon or a fake link (§0.3).

- MUST NOT default a component to showing a shortcut badge. It is opt-in per call site, and only where
  the caller has a real binding to advertise.
- **Origin:** `ComboBox`'s `shortcut` prop defaulted to `true`, so every search field built on it -
  "Search projects" in the dataset-upload flow, "Select Location" in DLA's Add a location modal -
  showed a `⌘K` badge with no `⌘K` handler anywhere in the app. Caught directly by the designer off a
  screenshot of the project-search field. Fixed once, at the component (`shortcut = false` by default),
  not per call site - `GlobalSearch` and the species picker had already opted out by hand, so they were
  unaffected either way. No component in this codebase currently has a real global shortcut to advertise.
- **Enforcement:** `REVIEW`.

### §2.11 A date field has a calendar

Every date a person enters in the product is entered with the design system's date field with a
calendar: `InputDatePicker` (`components/custom/date-picker/input-date-picker.tsx`), which lets them
type the date or pick it from the calendar. A person should never have to type a date blind.

- MUST NOT render the calendar-less `InputDate` (`components/base/input/input-date.tsx`) on a product
  screen. Its only place is its own doc page.
- **A required date, or a start-type date, opens as today** (designer, 6 Oct 2026: "ALL DATE FIELDS ACROSS ALL FORMS: Default
  to current sys date", narrowed to required and start-type dates): a project's start date, an agreement's start or valid-from
  date, a vocabulary's, user's or notification's start date, a voucher change's date. The person changes it if it is another
  day. An end date, an expiry, an embargo end and a filter's range stay empty, because empty means "ongoing" or "not narrowed";
  editing a record keeps the date it holds. The default is in the form's blank draft (`emptyDsaDraft`, `initialProjectDetails`),
  not in the field.
- **Origin:** the Controlled Vocabulary, DSA and DLA forms used `InputDate`, typed segments with no
  calendar; the designer asked for the calendar field everywhere ("always remember to use date fields
  with calendar input field from design system", 30 Sept 2026). Add Project, DLA and DSA then opened with an empty start date
  while the vocabulary, user and notification forms opened as today (6 Oct 2026).
- **Enforcement:** `AUTO §2.11` (an `<InputDate` under `app/pages` fails); the default is `REVIEW`.

### §2.12 Nothing on screen without a purpose

What ships is visually clean the first time: every mark on a screen (an icon, a border, a badge, a
fill, a divider, a column) earns its place by telling the person something they need. Decoration that
adds noise is a defect, the same as a bug, however correct the behaviour behind it.

- MUST NOT put an icon in a field, cell, label or button unless it carries meaning the text does not
  (a search glass on a search field, a calendar on a date field). A glyph that repeats the label, or
  marks every row the same way, is removed. When a component draws an icon by default and the call site
  has no meaning for it, the component gets an opt-in way to leave it out (§1.6), for example
  `ComboBox`'s `hideIcon`.
- A field or column is sized to what it holds: a one or two digit number is not given the width of a
  name.
- Repeated per-row controls recede: muted, compact, and aligned in one column. Spare width goes after
  the row's content, never between the content and its own controls.
- MUST look at every visible change in a live screenshot, at the size the designer works at, and judge
  it with `/emil-design-foundations` before presenting it (§0.6 item 4, §0.7 item 3). "It works" is not
  done; it is done when nothing on it looks accidental.
- **Origin:** the Controlled Vocabulary Entries grid's Order field showed a large # icon in every row,
  with the field as wide as a text column; the designer: "the # in this is too big and ugly ... Make
  sure you do visually aesthetic" (30 Sept 2026).
- **Enforcement:** `REVIEW` (a live screenshot and `/emil-design-foundations`, §0.6 item 4).

### §2.13 Nested corners are concentric: inner radius = outer radius - padding

Where a rounded element sits inside another rounded element and their corners meet (the inner one's corner is inside the outer one's corner),
the two curves share a centre. The inner radius is the outer radius minus the gap between the two edges at that corner:

> **inner radius = outer radius - padding**

- **The gap** is the padding of the outer element plus its border width (the distance from the outer element's outer edge to the inner element's
  edge). Measure it; do not read it off a class name.
- **Never below 0.** Where the gap is the same as or more than the outer radius, the result is 0: the inner corners are square. A rounded inner
  element does not stay rounded by being given the same radius as the outer one, or "a radius from the scale" that looks about right. Two curves
  that are the same size at different offsets are not concentric, and read as a mistake.
- **Choose the numbers so the result is on the radius scale** (`--radius-*`: lg 8, xl 12, 2xl 16, 3xl 20, 4xl 24), not an arbitrary pixel value
  (§2.1). Pairs that land on it: 2xl with 4px of padding gives xl; 2xl with 8px gives lg; xl with 4px gives lg; 3xl with 8px gives xl; 4xl with
  12px gives xl. Where the gap is a padding step that does not land on the scale, derive it from the outer's token so the two stay in step
  (`calc(var(--radius-2xl) - 0.5rem)`), never retype the number.
- **A design system component keeps its radius** (§1.5, §1.9; a card is `rounded-xl`, a field `rounded-lg`). When the inner element is one, change
  the outer element instead: outer radius = the component's radius + the gap, or reduce the gap until it fits the scale. Never patch the component
  to suit its container.
- **Applies at every level.** A panel, the sheet inside it and a card inside the sheet are each checked against the one around them. It applies
  only where corners meet: a card in the middle of a large container, with no corner of the container near it, has nothing to be concentric with.
  An element with a square outer (no radius) has no constraint on what is inside it.
- **Checked live, with numbers.** The §0.6 item 4 pass reads `getComputedStyle(el).borderRadius` of each rounded box and its container and the
  gap between them (`getBoundingClientRect`), and shows that inner = outer - gap, for every nested pair on the screen. `/emil-surfaces` (nested
  border radii) is the judgement tool for the cases the rule leaves open.
- **Origin:** the post-6-oct lab's panel (`rounded-2xl`, 16px), the white sheet inside it (`rounded-xl`, 12px) and the restrictions card inside
  the sheet (also 12px) sat 25px apart at their corners: three similar curves, none concentric. The designer: "inner radius = outer radius -
  padding. Please burn this into context, contracts." (19 Oct 2026).
- **Enforcement:** `REVIEW` (the live measurement above). A first occurrence, so no `AUTO` check yet (§0.8); one is due if it comes back. It cannot
  be found from class names alone, because the gap depends on the layout, so a check would have to measure a rendered page.

### §2.14 A key's entries line up in one column

A key (a map legend, or any group that is a title followed by entries which can wrap) is two columns: the title, and the entries. Where the entries wrap, the next row starts under the **first entry**,
never under the title and never at the container's edge.

- **MUST** put the title in a column of its own (a flex item that does not shrink) and the entries in a wrapping container beside it. MUST NOT put the title and the entries in one wrapping row, where the
  second row restarts under the title.
- **The title takes the entries' row height** (the legend: 20px), so its text sits on the first row's centre line, not above it.
- **Where there is no room for the title beside the entries** the key stacks: the title above, the entries in a grid of columns (the map's key under 680px of map), which already has its entries in columns.
- **Applies to** `MapLegend` (Map visualise's "Category", Explore's "Species group") and any key or lead-in-label-plus-entries group to come. Not to a row of chips or facts with no lead-in label (the filter chips,
  a report's facts).
- **Checked live, with numbers.** The §0.6 item 4 pass reads, for every row of entries of a key, the left edge of its first entry (`getBoundingClientRect`) and shows that it is the same x on every row, at each
  width the key is used at.
- **Origin:** Map visualise's key wrapped to two rows and the second, "Metadata", started under the title "CATEGORY" instead of under "Business rule", the first entry; the designer, with a screenshot (23 Oct
  2026): "align metadata to business rule. this should be a contract."
- **Enforcement:** `REVIEW` (the live measurement above). A first occurrence, so no `AUTO` check yet (§0.8); one is due if it comes back. A check on class names would be brittle (what makes the title its own
  column is the markup, not one class).

### §2.15 A derived view shows the source's fields as the source does

Where a screen shows records that another screen already shows in a table (a map or list opened from a report, a summary of one of its rows, a card for a record that has a page), each field it repeats is
written **as the source writes it**: the same field leads, a name is the same name, a field the source sets in italic is in italic. The source is the table the data is read from, or the screen the view was opened
from.

- **MUST** lead with the field the source leads with. A species is the **scientific name first, in italic, then the common name under it** (the report's `SpeciesCell`), wherever a derived view names a species: a
  list row, a summary heading, a marker's tooltip. MUST NOT put the common name first, or give the scientific name the common name's place.
- **MUST NOT** re-word, re-label, abbreviate, re-case or compute a field the source has (0.3), and MUST NOT show a field the source does not have.
- **What the view keeps as its own** is the type layer of its component (a card's title weight and size, 2.9): size, weight and colour follow the component the view is built from. Order, case, italics and
  wording follow the source.
- **Applies to** Map visualise (the card's rows, its record summary and its map tooltips, read from the Data Validation Error Report) and any view that is opened from a table or shows a table's row. It does not
  apply to a screen that is the source of its own list (Explore's species rows, the species picker, the nominations form), which have no table behind them.
- **Checked live, with numbers.** The §0.6 item 4 pass compares the first rows of the view with the same records in the source, field by field: the order of the lines, the text, the italics
  (`getComputedStyle(...).fontStyle`).
- **Origin:** Map visualise's rows and summary led with the common name ("Grass Tree") and set the scientific name under it, while the report's Species column leads with "Xanthorrhoea semiplana" and puts
  "Grass Tree" under it; the designer, with a screenshot of that column (23 Oct 2026), after the card had already been brought back to the table's data once (`2026-10-23-33-*`): "if it shows scientific
  name first, then it's what should show up - that's a non-negotiable contract."
- **Enforcement:** `REVIEW` (the live comparison above). A second occurrence of the card departing from its table (0.8), but not one that a check can find: which name leads is a choice of props and markup in
  a view, not a class or a string, so a pattern check would pass or fail by accident. It is named here as a recurring pattern, and the first thing to check in any view derived from a table.

### §2.16 A control's hit area is built into its component

Every control a person presses has a target of at least **40px with a mouse and 44px on a touch screen**, whatever it draws as. The component gives it, once, with the `hit-area` utility
(`app/globals.css`): an invisible box of that size, centred on the control, an `::after` of the control itself (so a press on it is a press on the control). It changes nothing about how the control
looks or where it sits. `--hit-min` is 40px, and 44px where the pointer is coarse (`@media (pointer: coarse)`); a control already that big is untouched.

- **MUST** put `hit-area` on the root of a component that renders a control smaller than 40px, and on a new component of that kind: `Button` (every size and colour), `ButtonUtility`, `CloseButton`, `Tab`, the
  input's clear and show-password buttons, the table's page numbers, `Checkbox`, `RadioButton`, `Toggle`, the dropdown's "..." button, `TooltipTrigger`, the date picker's buttons. The header gives every
  breadcrumb link its target once (`[&_a]:ghost-fill` and `[&_a]:hit-area`, below), because each shell draws its own crumbs. A control with a design of its own that is not one of these (a chip on a photo, a lightbox arrow) takes `hit-area` itself.
- **MUST NOT** write a `before:` or `after:` that enlarges a target at a call site (`before:-inset-y-1`, `after:-top-2`), and MUST NOT draw a small button, icon button, back link or close icon by hand where
  `Button`, `ButtonUtility`, `CloseButton` or `RecordBackLink` does the job (1.1, 0.9): the hand-drawn one has no hit area, and the component's has been tested.
- **A ghost control draws a 32px box and keeps a 40px target (designer, 23 Oct 2026).** A ghost control (Link grey, Ghost colour, `RecordBackLink`, a breadcrumb, a switcher's trigger) draws nothing until it is pointed at,
  then a gray fill and, from the keyboard, a focus ring, both on its padding box. The box is given by `ghost-fill` (`app/globals.css`): 6px of padding all round for a 20px line (`--ghost-min` is 32px; never under 6px)
  and an equal negative margin, so the text sits where it sat; its radius is 6px. The target stays 40px with a mouse and 44px on touch, by the `hit-area` the control also carries (the extension is invisible, 4px
  and 6px beyond the box). The first try made the box the target (40px, 10px of padding; "make the padding of ghost buttons consistent with the touch target sizes"): it took a quarter of a card's header, ran 6px
  from the card's edge and over its neighbours, and the designer asked for it to be fixed (2026-10-23-47, -59). MUST NOT set a ghost control's padding and negative margin by hand.
- **Two targets never overlap, and an extension never covers another control.** Where controls touch or sit closer than twice the extension, their group caps it (`[--hit-min:32px]`) or turns it off
  (`after:content-none` on each, or `data-no-hit-area` on the group): the edge-to-edge tabs of column 2, a button joined to an input, a star beside a menu. It is not for a full-width field (`Input`, `Select`),
  a row of a list or a menu stacked edge to edge, or a chip's own remove icon: an extension there would take over what is beside it.
- **A container that scrolls or clips around a control gives it room.** `ScrollFade` has 6px of padding above and below, taken back by an equal margin; any other strip that scrolls sideways around tabs does the
  same (`pb-1.5 -mb-1.5`). An extension that makes a container scroll is a defect. **Recurring (0.8):** the tab strips, then Explore's areas list (the "..." button's target reached 1px past its row and the list scrolled sideways and drew a scrollbar under the last area, 23 Oct 2026); the areas list now has 8px of room, taken back by an equal margin, and is a `ScrollFade`. It cannot be found from class names (which container holds which control is the markup), so it stays `REVIEW`, and the first thing to check, in every state a list or strip can be in (one row, many rows, a menu open), is `scrollWidth` against `clientWidth` of every scroller around a control. A control with a border centres on its padding box and sets `--hit-dx` or `--hit-dy` to half the difference (an underline
  tab's 2px bottom border is `[--hit-dy:1px]`). A control with no position of its own is made `relative` by the utility's base rule, so MUST NOT be given `static`.
- **Exception to 1.6:** it is on by default (see 1.6).
- **Checked live, with numbers.** The 0.6 item 4 pass presses just inside and just outside the box of a control it changed, with a mouse and with touch emulated (`hasTouch`, where `pointer: coarse` is true), and
  lists any scroller whose `scrollHeight` grew because of it. `/emil-ui-polish` (hit areas) is the judgement tool.
- **Origin:** Map visualise's touch targets were written one control at a time, a `::before` at each call site (`2026-10-23-25-*`), so every other screen still had 28px icon buttons, 20px crumbs and 32px tabs;
  the designer: "make sure the touch target bits are applied on a component level, then applied all across the webapp", and "Yes, please. Make sure these are documented in contracts" (23 Oct 2026). Of 2,315
  controls over 80 screens, 1,340 reached 40px before and 1,854 after (`2026-10-23-41-*`).
- **Enforcement:** `AUTO §2.16a` (a component that carries the hit area loses it), `AUTO §2.16b` (a negative-inset `before:` or `after:` written to enlarge a target under `app/pages`), `AUTO §2.16c` (a ghost control loses `ghost-fill` or its `hit-area`), `REVIEW` for the rest.

### §2.17 One scrollbar, drawn once, for every scroller

Every element that scrolls shows the same scrollbar: a thin thumb, 6px wide, no track, 2px in from the scroller's own edge and 8px short of each end (so it clears a card's rounded corner), drawn over the content. It shows while the
scroller scrolls and for 0.9s after, while the pointer is over the scroller or the thumb, and while the thumb is dragged (the scroller follows by the ratio of the lengths); it darkens when held. On a touch screen it is an
indicator only and takes no pointer events. Wheel, touch and keyboard scrolling are the browser's. It takes no width from the content on any system, so nothing moves when it comes and goes.

The browser's own bar is off everywhere (`* { scrollbar-width: none }`, `app/globals.css`) and one component, `<DrawnScrollbars />` (`app/_scrollbars`, mounted once in `app/layout.tsx`), finds any element that scrolls and
draws its thumb, in one layer above everything (`SCROLLBAR_Z_INDEX`, `lib/layers.ts`). A new scroller needs nothing: `overflow-y-auto` and a height.

- **MUST NOT** draw a scrollbar at a scroller: no `scrollbar-width`, `::-webkit-scrollbar`, `scrollbar-color` or `overflow: overlay`, no thumb built into a list or a component. MUST NOT turn the browser's bar back on for one scroller.
- **A box under 64px either way gets no thumb** (a tab strip, a row of chips: there is no room for one, and its fade, `ScrollFade`, is its cue). An element that has its own cue opts out with `data-no-drawn-scrollbar` (the lightbox's
  thumbnails, which have arrows and selection; the species photo carousel is the design system's `Carousel`, which does not scroll, so it has nothing to opt out of).
- **A thumb is drawn only where its scroller is what is under it:** a modal, a menu or the Prototype tools bar over part of the thumb hides it.
- **The fade stays where it was** (`ScrollFade`): the fade says there is more, the thumb says where and how much. They are not the same thing and a list may have both.
- **A page's scrolling `main` and a scrolling table keep `[scrollbar-gutter:stable]` (4.2f):** it reserves nothing now (the lane is 0) and costs nothing, and it keeps the content steady if the thumb is ever turned off.
- **Checked live, with numbers.** The 0.6 item 4 pass runs with the browser's scrollbars drawn (`ignoreDefaultArgs: ["--hide-scrollbars"]`: a headless browser hides them and the fault is missed), lists every scroller on the screens
  it changed and reads `offsetWidth - clientWidth` (0), and shows that the thumb is there while pointing at the scroller and gone about 1.3s after the pointer leaves.
- **Origin:** Explore's lists drew a classic bar that took 15px from the rows and showed a stray scrollbar under an area chip; the designer chose a drawn thumb from a lab of four (option D, 23 Oct 2026, `2026-10-23-53`), and then:
  "the scroll bar logic we added on the explore screens, let's make that consistent across the webapp." It had been built into `ScrollFade` for three lists; about 120 scrollers (page columns, tables, menus, modals) still showed the browser's.
- **Enforcement:** `AUTO §2.17` (the global rule or the mount is gone, or a hand-made scrollbar rule appears in `app/pages` or `components`), `REVIEW` for the rest.

---

## PART IV - THE SHELL (persona-consistent)

### §3.1 One header

Every real `/pages/**` screen renders `<AppHeader />` and nothing else at the top. It MUST NOT be
hand-rolled, copied, or wrapped to change what it shows.

- **Enforcement:** `AUTO §3.1`.

### §3.2 One rail, one icon map, legal links in the rail

Column 1 is `<PrimaryRail />`, icons come from `nav-icons.ts`, and the Terms, Privacy and Help links are
icons at the foot of the rail (`PrimaryRail`), on every screen and every persona. Column 2 carries no
footer block.

- **Origin:** the designer moved the legal links from a text block at the foot of column 2 into the rail
  (30 Sept 2026), so they survive on screens that have no column 2.
- **Enforcement:** `AUTO §3.2`, `AUTO §3.3`, `AUTO §3.5`.

### §3.3 Account controls live in the header

`ProfileMenu` and `GuestAuthActions` are used only by `AppHeader`. MUST NOT be copied.

- **Enforcement:** `AUTO §3.4`.

### §3.4 Persona consistency

A persona sees the same header and rail on every screen. Role-specific behaviour (org pill, the Add menu,
account control, Home's task badge, which sections the rail lists) is decided inside the shared component
from the role and `config/role-access.config.ts`, never at a call site. `public-user` is the only
deliberate exception, and only in account controls and gated actions.

### §3.5 The Add menu

The header has one "Add" button (Jira-style). What it offers comes from `lib/create-menu.ts`, filtered by
the role-access matrix. MUST NOT add a separate creation button to a header.

### §3.6 Position

The header is a top-level sibling before the rail + sidebar + main row, full width, never inside `main`.

### §3.7 Three columns

Primary rail, contextual sidebar, main - under the full-width header - on every screen and every persona.
A role that cannot use a section still gets all three, with the restriction stated in main. Column 2
always exists and always says something about where you are, except on a record page (below).

- **A record page has no column 2 (designer, 6 Oct 2026, generalising the project page's override).** The deep dive of any
  collection - a project, a DLA, a DSA, a nomination, a user, a role, a permission, a controlled vocabulary, a taxon, a
  voucher batch, a report - uses the whole width beside the rail. Where you are is the breadcrumb and its switcher over the
  collection (§4.6 item 5); the record's actions are in its card. The list, and a create or edit form (whose sections are
  column 2, §4.1), keep their column 2. A role that cannot open the record still gets the restriction with all three columns.
  A shell takes this from its record props (`recordPage`), so a new collection's shell MUST do the same.
- **Enforcement:** `AUTO §3.7b` (a shell that draws the Section sidebar and takes a record prop, without `recordPage`).

- Exempt by name: `app/pages/biodata-home` (marketing), `app/pages/auth/**` (auth flow) and `app/pages/page.tsx`
  (the `/pages` screen index, a directory of screens rather than one).
- **Override (designer, 30 Sept 2026), now the rule above:** the project page (`/pages/project-list/<id>/project-details`,
  `/pages/project-detail`) and that project's record pages have no column 2, for every persona. The
  project's own actions are in the hero's "..." menu, the records tree is on the Survey records tab, and a
  breadcrumb project switcher replaces going back to the list. Logged in
  `context/decisions/2026-09-30-07-*`; it is scoped to those screens and is not a precedent (§0.1).
- **Override (designer, 1 Oct 2026):** Explore (`/pages/observations`) has no column 2, for every
  persona, so the map takes the full width. Its search areas are a section of the floating search card and
  the data-access notice some roles see is the warning banner across the top of the map. Explore's second
  layout (`/pages/observations/option-2`) was retired on 23 Oct 2026 (§4.4), so this now covers the whole of
  Explore. Logged in `context/decisions/2026-10-01-*`; it is scoped to that screen and is not a precedent (§0.1).

### §3.8 Floating dev tools

The preview controls (the role, a screen's layout options, a simulated run's outcome) live on one bar,
the Prototype tools (`app/_prototype-tools/`), mounted once per screen as `<PrototypeTools />`:
draggable, above every map overlay (`z-[10000]`), and MUST NOT be compensated for with padding or margin
in product layout. Modals and slide-over panels sit above it (`z-[20000]`, `lib/layers.ts`): a modal covers
everything, the dev tools included.

- A tool shows only where it applies: the role is always there, and any other tool is added by the code
  that owns it (`useRegisterTool`), only while it is on screen and has something to do. MUST NOT add a
  separate floating button for a preview control, or show a tool on a screen where it does nothing.
- The bar is Scaffold (§1.5): Geist, react-aria primitives, never DEW components, and coloured in Flinders
  Violet so it never reads as part of the product.

### §3.9 Navigation order

`lib/nav.ts` `Components` and `config/design-system.config.ts` keys are strictly A-Z. A new entry is
slotted, never appended. If either list is found out of order, the whole list is fixed. (`Primitives` and
`Patterns` follow a foundations-first order, and `Principles` comes before them, so they are exempt.)

### §3.10 Column 2 is navigation and actions only

The contextual sidebar (column 2) holds where you are and what you can do from here: a section label, a
list or tree or scope switch that moves you around, and the Actions group (export, report). It MUST NOT hold information: no explanatory copy, no steps or explainers, no alerts, task cards
or accordions. Information sits in main, above the content it explains.

- **Exception:** the public-user (signed-out visitor) column 2, which explains what BioData SA is and
  points to guides (`GuestAboutAside`). No other persona and no other screen.
- **Where the information goes.** "What is this" content is never in column 2. A short one (how a nomination is
  reviewed) is an `ExplainerCard` (`app/pages/_shared/explainer-card.tsx`) above the list it belongs to, closable;
  a notice about the whole screen is a `PageBanner`. Both are documented at `/patterns/banners`. Where a longer
  explanation should live is not decided (the project explainer is parked, see the backlog in `ref-shell.md`).
- **Origin:** the nominations list put a "How a nomination is reviewed" steps explainer in column 2; the same
  mistake came back as the "What is a project?" and project guides block in the Projects column 2, which the check
  missed because its headings were inside a component the aside rendered (designer, 1 Oct 2026, section 0.8).
- **Enforcement:** `AUTO §3.10` (a left-hand `<aside>` in `app/pages` containing a heading, Progress steps, alert,
  accordion or task card, or rendering a component whose own markup does, except the public-user file). It
  catches structural information only; prose in a plain paragraph is `REVIEW`.

---

## PART V - PATTERNS

### §3.11 Every item in column 2 has an icon

Every navigation item in column 2 (a scope tab, an area tab, a view tab, an action row) MUST carry an icon to the
left of its label, so the column scans by shape as well as by word and reads the same on every screen. The same
items in the mobile menu carry the same icons.

- **Which icon.** "All X" takes the section's own icon from `sectionIcons` (`nav-icons.ts`), as "All projects"
  takes the Projects icon; "My X" takes `User01`. An area or view tab takes the icon of what it holds (All users
  `Users01`, All roles `UserCheck01`, All permissions `Key01`; Home's My BioData `User01`, Flora and Fauna Dashboard
  `PieChart03`). An action row carries its action (Export CSV `Download01`, Create report `BarChart01`).
- **One icon per concept (§2.4).** An item has the same icon in column 2 and in the mobile menu, and on every
  screen it appears. A new item takes an icon that is not already another concept's.
- **Built with.** `Tab icon={...}` in column 2, `ActionRow icon={...}` for actions, and `MobileNavItem`
  (`app/pages/_shared/mobile-nav.tsx`) for the extra items in the mobile menu, never a hand-built button.
- **Not covered.** The section label above the items (a heading, not an item), the numbered steps of a form's
  section list (the step marker is its icon, §4.1), and data rows such as the project's records tree (each row
  carries its own record-type icon).
- **Origin:** the All / My switch on DLA, DSA and nominations and User Management's Users / Roles / Permissions
  tabs were text only, beside Projects and Home, which had icons (designer, 1 Oct 2026).
- **Enforcement:** `AUTO §3.11` (a vertical `TabList` whose `<Tab>` has no `icon`), `REVIEW` for action rows and the
  mobile menu.

### §3.12 Every action button carries an icon

Every action button MUST carry an icon that names its action: on the left of the label (`iconLeading`), or a
forward arrow on the right (`iconTrailing`) for a button that moves on. An action button is a filled or outlined
`Button` with a text label: `primary`, `secondary`, `tertiary` or a destructive colour.

- **Not action buttons.** An icon-only button (an `aria-label`, no text) and a link-style button (`link-color`,
  `link-gray`, `link-destructive`) are not covered; they may still carry an icon.
- **One icon per action, everywhere (§2.4).** An action has exactly one icon, and it is the same wherever the action
  appears: a labelled button, an icon-only button, a menu item, a `RecordAction`, a card's or a field's hover icon, a
  doc page's example and a shared component's built-in menu (designer, 25 Oct 2026: "Icons must be same for the
  corresponding actions across everywhere"). A near-twin glyph from the same family (`Edit01`-`Edit04` beside
  `Edit05`, `UploadCloud02` beside `Upload01`, `DownloadCloud02` beside `Download01`) is a different icon and MUST NOT
  stand in for the action's own. The reverse holds too: two different actions MUST NOT share an icon on one screen
  (Rename and Edit are told apart). The set:

  | Action | Icon |
  | --- | --- |
  | Create, add, new, request | `Plus` |
  | Continue, next (trailing) | `ArrowRight` |
  | Back | `ArrowLeft` |
  | Go to another screen (trailing) | `ArrowNarrowRight` |
  | Cancel | `XClose` |
  | Keep editing, back out of a prompt | `ArrowLeft` |
  | Discard, delete, remove | `Trash01` |
  | Save, save draft | `Save01` |
  | Done | `Check` |
  | Approve, accept, resolve | `CheckCircle` |
  | Reject | `XCircle` |
  | Start or resume a review | `PlayCircle` |
  | Put on hold, disable, deactivate | `PauseCircle` |
  | Activate, enable, reactivate | `Power01` |
  | Archive, restore | `Archive`, `FlipBackward` |
  | Cancel an agreement or request | `SlashCircle01` |
  | Edit, change | `Edit05` |
  | Rename | `PencilLine` |
  | Duplicate, copy | `Copy01` |
  | Download, export | `Download01` |
  | Upload, replace a file | `Upload01` |
  | Search | `SearchLg` |
  | Reset, re-generate, show everything again | `RefreshCcw01` |
  | Select all | `CheckDone01` |
  | Show more (reveal the next rows of a list) | `ChevronDown` |
  | Log in, sign in | `LogIn01` |
  | Sign up | `UserPlus01` |
  | Request access, reset a password | `Key01` |
  | Open a report, open guides | `BarChart01`, `BookOpen01` |
  | Flag, add a link | `Flag01`, `Link01` |

  An action not in the set takes the icon Figma draws, or the closest existing one (§2.4), and is added here.
- **One control per action.** An action appears once on a record: two controls that do the same thing (a header "..."
  menu repeating the Add and Edit buttons under the title) are a defect. A record's actions sit together under its
  title; the bar above it holds navigation only (the path, full screen).
- **Not covered by the set.** An icon that names a concept rather than an action (a tab, a category tile, a resource
  type, a record kind) follows §2.4 and §3.13, not this table: `UploadCloud02` is the Uploads tab, not the upload action.
- **Modals and shared components.** A modal's buttons are action buttons. `ConfirmationModal`, `DestructiveModal` and
  `FormModal` require `confirmIcon` / `submitIcon` (an action is never the same twice, so there is no default) and
  default Cancel to `XClose`; "Keep editing" on a discard prompt takes `ArrowLeft` (`cancelIcon`). A button-style
  alert takes `confirmIcon` (`PageBanner` requires `actionIcon`). The file field's Browse, multi-select's Reset and
  Select all, and the table pagination's Previous and Next carry theirs. A component that renders a text button of
  its own carries an icon for it, required where the action varies.
- **Origin:** the DLA record page's Approve, Reject and Start review buttons had no icon beside Edit and Download,
  which did, and some 50 other filled and outlined buttons across the forms, the auth flow and the registration
  flow had none; the check then missed every modal, because their buttons live in a shared component (the Approve
  request modal's Cancel and Upload and Approve, the file field's Browse), so the same gap was found again
  (designer, 1 Oct 2026, section 0.8). One icon per action, everywhere: the project records panel had Edit and Add
  both in its header "..." menu and under the title, Edit drawn with `Edit02` in one and `Edit05` in the other, and a
  sweep found 22 more drifts (four pencils, `UploadCloud02` on four upload buttons, `DownloadCloud02`, Rename as
  `Edit03` on the map and `PencilLine` in Taxonomy) (designer, 25 Oct 2026).
- **Enforcement:** `AUTO §3.12` (an action button with no icon anywhere under `app/pages`, the auth flow and the
  home page included, or in `components/application`, `components/base` and `components/custom`; the two stale
  unlinked drafts are exempt), and `tsc` for `RecordAction.icon` and the modals' required icon props. `AUTO §3.12b`
  (under `app/pages`, the doc pages, the Prototype tools and `components/application`, `base` and `custom`: an import
  of a pencil other than `Edit05`; or a labelled action, a `label` with its `icon` or a `Button`'s text with its
  `iconLeading`, whose first word is in the table and whose icon is not that action's; "Add", "Cancel" and "Change"
  are not keyed, because the table gives them more than one icon, and the marketing home's feature tiles are exempt).
  `REVIEW` for icon-only controls and for one control per action.

### §3.13 Underline tabs carry icons

Every tab in an underline tab list (a record page's sections, the project page, the dashboards, a report's tabs) MUST
carry an icon to the left of its label, as column 2's items do (§3.11): the icon of what the tab holds, so a tab row
scans by shape as well as by word and the same section has the same icon on every screen.

- **Which icon.** The one the app already uses for the same thing (§2.4): Overview `Grid01`, Locations `MarkerPin04`,
  Species `Feather`, Survey records and Data Collection Scope `Database01`, Artefacts and attachments `Paperclip`,
  Project and Projects `Folder`, Permit and Agreement `FileCheck02`, Audit log and history `ClockRewind`, Privacy and
  Restrictions `Lock01`, What to protect `Shield01`, Data Sharing `Share07`, Comments `MessageSquare01`, URI/DOI `Link01`,
  Roles `UserCheck01`, Permissions `Key01`, Users `Users01`, Details `File06`, Favourites `Star01`, Uploads
  `UploadCloud02`; Flora and Fauna take the species group icons, and the record kinds the records tree's icons
  (`record-icons.ts`). A new tab takes an icon not already another concept's, and is added here.
- **Counts** (`badge`) stay after the label; the icon does not replace them.
- **Exempt (open, see the backlog in `ref-shell.md`):** Explore's results tabs (Species and Projects, since the other
  four were removed on 23 Oct 2026; the designer's redesign of the card draws them without icons, and with two tabs the
  width that was the first reason no longer applies), a record's dynamic section tabs (`project-details-view.tsx`,
  whose titles come from the data), and Home's task status filters (`Tabs.List`, filters, not sections).
- **Origin:** column 2 and the method tabs had icons while the underline tabs did not (designer, 1 Oct 2026: "these to
  also have icons"); the lab at `/proto/tab-icons` measured the options (A text, B every tab, C selected only) and B
  was chosen.
- **Enforcement:** `AUTO §3.13` (an underline `TabList` in `app/pages` with no `icon` in it, except the two listed files).

### §4.1 The form pattern

Every create or edit form (Add Project, DSA, DLA, and any new one) MUST render `<FormPage>`
(`app/pages/_shared/form-page.tsx`) with fields laid out in `<FormRow>`. Documented at `/patterns/forms`.

1. **Header:** an optional eyebrow, the title (with a status badge for an existing record), a one-line
   subtitle, and one **close button (X)** at the top right (`CloseButton`, labelled "Close form"): the way out
   of the form. The header describes the step; it MUST NOT hold any other action.
2. **Sections live in column 2.** A form with more than about two or three field groups is split into
   sections, and the sections are listed in the contextual sidebar as a `FormSectionList` (rendered into the
   shell through `FormSidebar`), which is the real **vertical Progress steps** component
   (`Progress.IconsWithText`, `orientation="vertical"`): a progress bar, the sections grouped by step, and a
   state per section (current, complete, needs attention, not started). Any section can be opened at any time. Sections MUST
   NOT be tabs, a horizontal stepper, or a forward-only wizard. Related fields share a screen.
3. **Rows:** label and help on the left, fields on the right (`FormRow`). Required fields are marked `*`.
4. **Mandatory details block progress.** Continue does not move on, and jumping forward through column 2
   is refused, while the current section has mandatory fields missing. Going back is always free. When it
   refuses, the form shows a **"Details missing" error alert** above the fields (`FormPage` `problems`,
   an `AlertFullWidth` with `wrap`) that names exactly what is missing, and switches on the inline error
   on each empty field. Nothing turns red or alerts while a person is still on their first answer; it only
   happens after they try to move on, and **only for the section they tried to leave**. A section they have
   not reached is never validated, marked, or counted ahead of them (it stays "not started"), and
   arriving at it never shows it in red. The one exception is Submit, which checks the whole form. Column 2 marks the sections that still need attention, with a
   count. The alert and the inline errors are the only feedback; MUST NOT add a second message for the
   same fact.
5. **Footer:** every action, where the task ends. **Back a step** (secondary, left arrow icon) on the left,
   hidden on the first section. On the right, **Save draft** (secondary), then the primary action:
   **Continue** (right arrow icon) to move on, or the final action (**Submit**, **Create project**, **Save
   changes**) on the last section. Save draft is omitted when a draft makes no sense (editing a live record).
   Toasts are lifted clear of this footer everywhere (`TOAST_OFFSET`), so they never cover its buttons.
6. **Leaving:** the close button asks before discarding unsaved changes (`ConfirmationModal`), and says
   what will be lost.
7. **Controls:** real DEW components only (`Input`, `TextArea`, `Select`, `MultiSelect`, `RadioGroup`,
   `Checkbox`, `Accordion`). No bespoke choice tiles.
8. **Draft:** a draft needs only what identifies the record; submit validates the rest.

- **Exempt:** editing in place on a detail page's own cards, which follows §4.7 instead. (Add Project's one-question-per-card option was
  exempt until it was retired on 23 Oct 2026; Add Project is the form pattern, sections in column 2.)
- **Enforcement:** `AUTO §4.1` (a file that uses `FormRow` must import `FormPage`), `AUTO §4.1b` (a `FormPage` screen must not use tabs).

### §4.2 Lists and tables

Every collection screen is Section header, then search, then table: `SectionHeader` (title, a real
`CountBadge`, subheading, primary action), a real `Input` search, `TableCard.Root` around `Table` with
`TableCard.PaginationNumbered`. Applies at every scale, including a small table inside a detail tab. A
list is a table page whose rows are links (`href`), and the deep dive is its own route
(`/pages/<name>/<id>`); create and edit are routes too. Never a hand-rolled header or a bare unpaginated
table.

**The table fits the viewport.** A collection screen never scrolls as a page because of its table. The
section header, banner and search keep their height, the table takes the rest, the rows scroll inside it
under a sticky header, and the numbered pagination stays pinned at the bottom.

- MUST give the table `Table bodyScrollable` and `Table.Header sticky`, put it in a `TableCard.Root` that is
  `flex min-h-48 flex-1 flex-col`, and give every ancestor up to the shell's `main` `flex min-h-0 flex-1 flex-col`
  (the section header and search are `shrink-0`). The `min-h-48` floor lets a very short window scroll the
  content area instead of collapsing the table to nothing.
- MUST NOT let a collection table grow to its full height and push the page into scrolling.
- **Exception (embedded table):** a small table inside a detail tab (a record's systems, a measurements
  table). The page is the scroll container there and the rows are few, so it keeps its natural height.
- **Exception:** doc pages and `/proto` labs.
- **Origin:** the Explore results page grew taller than the window and carried the toolbar and pagination
  off screen with it; the Projects, DSA and DLA lists did the same once they held more than a few rows.
- **Enforcement:** `AUTO §4.2b` (a screen using `TableCard.Root` without `bodyScrollable` fails, except the
  embedded tables listed in the script), `REVIEW` for the layout chain.

**One search width (§4.2c).** The search box in a collection toolbar (the row of search, then Filter,
then any view or tree controls, above a list, table or tree) is the same everywhere.

- MUST render `<ToolbarSearch>` (`app/pages/_shared/toolbar-search.tsx`): 384px wide (`max-w-sm`), shrinking
  only on a narrow screen, small size, the `SearchMd` icon. Filter sits directly after it.
- MUST NOT let the toolbar search grow to fill the row (`flex-1`), or give it its own width.
- **Open, not decided:** the species results search (`species-results.tsx`) was made full width on the
  designer's instruction before this rule existed (it was Explore's results page, retired on 23 Oct 2026, and the
  dataset ingestion lab is now the only screen that shows it), and project-detail option 2's records search is
  `max-w-md`. Both now have the Filter menu beside them, so the check names the first as an exception
  (`species-results.tsx`); bringing them in line is for the designer to decide.
- **Origin:** the Survey records toolbar on project detail Option 3 grew its search to the full row while the
  Projects, DSA, DLA and User Management lists all used 384px.
- **Enforcement:** `AUTO §4.2c` (a file with a `FilterMenu` whose search is a hand-rolled `Input` with a
  search icon fails), `REVIEW` for toolbars without a Filter button.

**The filter (§4.2d).** Every table that can be filtered has the one filter (designer, 1 Oct 2026, chosen from the filter
options lab, option A): a **Filter** button, directly after the search, that opens a contextual menu of the attributes
(`FilterMenu`, `app/pages/_shared/filter-menu.tsx`). Each attribute is a row with an icon and a name, a line between
related groups, and the number ticked where it is on; pointing at it opens its values in a submenu beside it, a tick after
each value that is on (a date attribute offers its presets and a Custom range). The filters that are on are removable chips
under the toolbar, with Clear all (`AttributeFilterChips`, `app/pages/_shared/attribute-filter.tsx`). Documented at
`/patterns/filters`.

- MUST be the only filter on a table: no second Filter button, popover, side panel, accordion of values or hand-built chips.
  A list is described to it as attributes (`useAttributeFilter`), as sections and getters (`useListFilter`,
  `list-filter.tsx`), or as a selection kept outside the list (`useSelectionFilter`).
- **Exception (designer, 5 Oct 2026): column 2 may draw the filter as places.** The Template Finder's column 2 lists
  All templates, then the species types and collection methods under group headings, with counts
  (`TemplateNav`, chosen in `/proto/column-2`). Those items are this filter, not a second one: choosing one MUST set
  that attribute in the list's one filter state, so the Filter menu, its chips and column 2 never disagree, and
  "All templates" clears every filter. Any other screen that does the same follows the same rule and needs the
  designer's say-so first.
- MUST apply as values are chosen and MUST NOT have an Apply button (§1.9 item 2). Escape closes the menu a level at a time
  and never changes what is ticked.
- MUST go back to page 1 whenever a filter changes.
- MUST give every attribute an icon that names what it holds (`icon`; one left out gets the icon for what its name says).
- **A list of values that grows with the data (a project, a person, an organisation, a site) is searchable and bounded.**
  Mark it `searchable`: from 4 values up its submenu has a search box at the top (the keyboard goes from the box into the
  list), what is ticked stays on top however it is searched, and at most 50 others are drawn at a time with a line saying
  how many are waiting ("50 of 1,284 shown. Search to find the rest."). The data can run to thousands of projects, so
  scrolling a full list is not a way to find one. A fixed set (a status, a kind, an access level) is not `searchable`
  and shows all of its few values. The rule is `boundedOptions` (`app/pages/_shared/option-checklist.tsx`). MUST NOT
  hand-roll a list of values for a filter.
- MUST NOT add an attribute the data cannot filter on (a "Project timeline" range needs project start and
  end dates the project list does not carry yet). What is filtered is a column you would scan, never an identifier
  (the search covers IDs and names).
- **Origin:** the Data Ingestion Report has nine filter attributes; twelve always-open filters and a section per facet in
  one popover were rejected (30 Sept 2026), then a lab compared a contextual menu, quick filters on the toolbar and a
  side panel, and the designer chose the menu and asked for it on every table with filtering (1 Oct 2026). Until then the
  lists had a popover of every section open (`ListFilterButton`), the reports an "Add filter" popover, and Explore a side
  panel of accordions, three filters for one job.
- **Enforcement:** `AUTO §4.2d` (the old filters' labels, a button or panel titled "All Filters" or "Add filter", under
  `app/pages`), `tsc` (`ListFilterButton` and `AttributeFilterButton` no longer exist), `REVIEW` for the rest.

**Empty tables (§4.2e).** A collection with no rows to show renders `<ListEmptyState>`
(`app/pages/_shared/list-empty-state.tsx`) in place of the table: a gray FeaturedIcon, a heading, one balanced
line that says why and what to do, then the action. Two cases, told apart: nothing exists yet (no action unless
the designer names one), and nothing matches (an action that undoes the narrowing, named by its outcome, e.g.
"Show all uploads").

- MUST NOT leave a bare line of grey text where the table would be.
- **Exception (designer, 16 Oct 2026: "in the empty states, can we just add one record ... just mock data"):** a report whose table has
  no row of its own shows one mock record, marked "Example record" on the toolbar, in place of the empty state (`DataReport`'s `example`;
  the Flora Taxonomy Report's Species attributes and Species synonym tabs, the Fauna Taxonomy Report's Species status, Species reference and Species attributes tabs, and the Project Audit Log Report). It
  goes when a real row exists, is never stored, is made only of placeholder people (0.3) and made-up values, and the search and filters
  act on it like any row (so "nothing matches" still shows the empty state). Other collections keep the empty state.
- MUST NOT name the action "Clear search" (it collides with the search box's own clear button); name what the
  person gets back.
- **Origin:** the Data Ingestion Report showed "No uploads match your search and filters." as a lone sentence
  under the chips (designer screenshot, 30 Sept 2026); the Projects, DLA, DSA, Nominations and artefacts lists
  had the same line.
- **Enforcement:** `REVIEW`. First occurrence of this fix, so no `AUTO` check yet (§0.8); one is due if it recurs.

**Stable tables (§4.2f).** A collection table's columns keep their width whatever rows are showing. Every table
that is filtered, searched, sorted or paged is `<Table layout="fixed">` and gives every column a width on its
`Table.Head` (a percentage for a list that fills the screen, a pixel width for a wide report), with a `min-w-*` on the
table so a narrow window scrolls it sideways instead of crushing a column. A value longer than its column wraps or is
cut with an ellipsis and its full text as the tooltip; it never widens the column.

The same holds for a scrollbar. A classic one (Windows, or a Mac with a mouse) takes about 15px from the content when
it appears, in a scroll area that overflows in one state and not in another (All beside My, one tab beside another). The product's
scrollbar is drawn over the content and takes no width (2.17), so nothing moves; a scrolling `main` still reserves the gutter
(`overflow-y-auto [scrollbar-gutter:stable]`) and a scrolling table does it itself (`bodyScrollable`), at no cost, so the content stays steady if the drawn thumb is ever turned off.

- MUST NOT leave a collection table on the automatic layout: it sizes each column to its widest cell, so switching
  All to My, a search, a sort or the next page moves every column.
- MUST NOT leave a column without a width in a fixed table (the browser leaves the space unused).
- MUST NOT make a page's scrolling `<main>` `overflow-y-auto` without `[scrollbar-gutter:stable]`.
- **Exception:** the results table (`map-search/results-table.tsx`), whose columns are chosen by the person (Explore's
  second layout showed it until 23 Oct 2026; the dataset ingestion lab's species results now do), and the lab-only
  `ingestion-report.tsx`; both are listed in the check and are open, see the backlog in `ref-shell.md`.
- **Origin:** the nominations list moved every column when the designer switched from All to My, because one row
  had a second line (an organisation) and another a long status; every other list had the same flaw (designer,
  1 Oct 2026: "no dance-y layouts").
- **Enforcement:** `AUTO §4.2f` (a `Table` with `bodyScrollable` and no `layout="fixed"`, or a `<main>` with `overflow-y-auto`
  and no `scrollbar-gutter`, under `app/pages`). A headless browser hides scrollbars and the lane goes unseen: the live pass runs with them drawn (2.17).

**One gap under the header (§4.2g).** Under a `SectionHeader`, the collection body (any notice, the toolbar,
the table) sits in one wrapper with `p-6`: the same 24px between the header's divider and the search on every
list, and 24px to the sides and bottom.

- MUST wrap the body that follows `</SectionHeader.Root>` in a `div` with `p-6` (`flex min-h-0 flex-1 flex-col
  gap-4 p-6`, as every list does).
- MUST NOT give that wrapper side and bottom padding only (`px-6 pb-6`) or none at all: the search then sits
  flush against the header's divider.
- **Origin:** the Notification Management list and the project's Datasets view both shipped with `px-6 pb-6`,
  the search box touching the divider, while every other list used `p-6`; the designer: "This error is recurring
  fix it and add to contracts" (1 Oct 2026).
- **Enforcement:** `AUTO §4.2g` (in a file with `<ToolbarSearch>`, no `div` between `</SectionHeader.Root>` and the
  first `<ToolbarSearch>` carries `p-6`, `pt-6` or `py-6`).

**A table that fits one page is the basic table (§4.2h).** An embedded table (in a form, a review step, a record's tab, a
popover) whose rows all fit on one page, 10 or fewer (the smallest page size `TableCard.PaginationNumbered` offers), is the
basic Table primitive (`components/base/table/table.tsx`: `Table`, `TableHeader`, `Column`, `TableBody`, `Row`, `Cell`) in a
bordered container (`overflow-hidden rounded-lg border border-secondary bg-primary`), with no pagination. Past 10 rows it is
`TableCard.Root` with `TableCard.PaginationNumbered`, as above. The switch is made on the row count, so the same table moves
between the two as rows come and go.

- MUST NOT show "Rows per page", Previous, Next and "1 - 1 of 1" under a table that cannot have a second page.
- A collection screen (a list page, a report) keeps `TableCard` and its pagination whatever its count: its rows grow, and its
  toolbar and the fit-the-viewport rule depend on the card.
- The basic table has no selection, sorting or card. A row action (Remove) is a link-style `Button` in a cell; a
  bare `Checkbox` in a cell does not work, because the table's rows supply its checkbox context.
- **Origin:** the nomination form's "Already restricted" table and the Review step's table showed a full pagination bar under a
  single row; the designer: "use a basic table component if there is less results per page. add this to contract" (25 Oct 2026).
- **Enforcement:** `REVIEW`. A first occurrence, so no `AUTO` check yet (§0.8): the row count is only known at run time.

### §4.3 Cognitive load

More than five or six field groups needs tiering. A conditional field is conditional in the UI. One focal
point per view. Never restate a fact in two treatments on one screen. When load and one extra click are in
tension, take the click.

### §4.4 Options

`option-1 ... option-n` routes are what designers present to stakeholders while a screen is being
explored. When a direction is chosen the others are deleted. A comparison is presented through
`LayoutOptionSwitcher`.

A lab (`/proto/<name>`) that has been folded into a page, or that is built for one, is registered in
`app/_prototype-tools/production-routes.ts`. The Prototype tools bar on that lab then shows "In production" with the
page's name, which opens the live page with the role being viewed kept, so a folded decision can be seen where it
shipped. Where the role being viewed cannot use that page at all (a public user and the Template Finder), the link opens
it as the lowest role that can, and says so ("as Registered User"): it never lands on a restriction message. A lab about
one persona's version of a page (Home looks different to an admin, a registered user and a public user) names that persona
in its line, and the link opens the page as that persona. Folding a lab
into a page is not finished until its line is there.

- **Enforcement:** `REVIEW`. First occurrence, so no `AUTO` check yet (§0.8).

### §4.5 Generated screens

`/test-*` screens prove a Figma frame maps onto the library: every contained widget is real or `<Gap>`,
they ship the token inspector, and their own content is Barlow. `/pages/*` screens have none of that
apparatus.

### §4.6 Record pages follow the project page

Every record page (a project, a DLA, a DSA, a nomination, a user, role or permission, a report, and any new
record) is laid out like the project page (`/pages/project-detail`):

1. A Back link on its own above the card (`RecordBackLink`).
2. The gradient identity card (`RecordHero`): eyebrow, title, a row of label/value facts, and the
   record's actions at its top right (`RecordActionBar onDark`): one button for the next step, every
   other action in the "..." menu, destructive ones below a divider.
3. Optionally, one notice saying where the record stands and who acts next.
4. Underline `Tabs`, each panel a bordered card of label/value rows (`RecordRow`). A report is a record whose
   content is a table: under its card come the report's counts (`MetricTile`s), then search, the attribute filter
   and the table (`DataReport`, `app/pages/_shared/reports/report-table.tsx`); a report with parts has underline
   `Tabs` for them. Its eyebrow is "Report"; its facts are the date of its newest record where its rows carry a date and
   the report's own totals (Events, Occurrences, Observations; Total records), and nothing that restates the table: no row
   count (the table's footer says it), no column count (the Columns button says it), no scope line (the description is the
   same for every role, and the rows are what the role may see).
   A breakdown of those totals (species groups, errors by kind) is a row of `MetricTile`s under the card, an overview.
   A report has no next step, so all its actions (Export CSV, Export XLSX) are in the card's "..." menu, like the other record
   pages, with no white button. Every report has both exports (designer, 6 Oct 2026: "Three dot menu to export as CSV, XLSX"),
   for the rows in view and every column: `DataReport` builds them from the report's columns (`exportName`, `report-export.tsx`),
   so a report MUST NOT write its own export or leave it out (`tsc` fails a `DataReport` without `exportName`).
   **The report's controls are one toolbar row (designer, 15 Oct 2026; documented at `/patterns/report-toolbar`):** the search, a
   **Parameters** button, the Filter button and, at the right, the Columns button. What the report is **run on** (a project, a
   dataset: what neither the search nor the Filter can say) is its Parameters: one button between the search and Filter
   that opens a popover of the report's own fields (`ParametersPopover`, `report-parameters.tsx`, given to `DataReport` as
   `parameters`), with a count on the button and a chip beside it for each parameter that is set, so closing the popover loses
   nothing. A code or a name is the **search**, which matches it already; what you **narrow the rows by** (a status, a family, a region, a
   person, a date range) is a Filter attribute (4.2d). A control is never in two of the three, and a report MUST NOT ask for the same thing
   twice. A sheet's metadata (the Flora Taxonomy Report) is therefore the table's own search and Filter, and the export writes it above the
   columns.
   A report with no parameters has no Parameters button (2.12). The fields are the design system's, labelled above, applied as
   chosen with no Apply button (1.9 item 2), a date being the date field with a calendar (2.11); a report that is always on one
   thing (one dataset) shows it as chips and has no Reset. MUST NOT draw parameters as a grid of fields, a row of selects or a
   panel between the card and the toolbar, or add a second filter control (`tsc` fails the old `scopeControl`, which no longer
   exists). **Exception (designer, 23 Oct 2026: "I feel having parameters is weird. What if they sat as drop downs instead ... move it to the
   right of the filters button"), for the Data Validation Error Report only:** its project and its dataset, two linked choices (a dataset
   belongs to a project) that the whole report is about and that are changed often, are two dropdowns on the toolbar, to the right of
   Filter (`parameters.inline`, `report-parameters.tsx`): the design system's `Select`, small, 256px each at the least and growing into spare room up to 384px, each with the design system's own label above it ("Project", "Dataset": the `Select`'s `label`, as
   every other labelled field; a dropdown named only by an `aria-label` tells a sighted person nothing, and a label drawn inside the trigger is a pattern the design system does not have, 23 Oct 2026), the row aligned by its foot,
   each showing its code or id first and the name or file after it, and cut by what it is when it is too long for the dropdown: the code is never cut, a project's title is cut at a word (`truncateAtWords`),
   a dataset's file name in the middle so its version and extension stay (`labelEnd`, `splitFileName`: "DS-2026-01003 · flinders_bush...01.xlsx"), the full text is the tooltip, and the open list is as wide as its longest row (up to 40rem), with no Parameters button and no
   chips, because what each is set to is what it shows. The row is search, Filter, the dropdowns, then Columns. Any other report that wants
   the same takes `inline` with the designer's say-so (0.4); it is not the default. The table keeps at least 24rem, about 7 rows (`DataReport`), so where the card and controls take more the page
   scrolls and the table does not shrink.
   A "Columns" button at the right of the toolbar (`column-chooser.tsx`) opens one popover where columns are shown,
   hidden and reordered (by their handle or the keyboard), the first column pinned and always shown, applying as
   each is chosen with no Apply button (1.9 item 2), and a Reset; its label says how many are hidden.
5. **The breadcrumb.** On a record page the section crumb is a switcher, not a plain label or a link back: the
   section's name with an up-down caret (`BreadcrumbSwitcher`, `app/pages/_shared/breadcrumb-switcher.tsx`, through
   a thin wrapper per collection such as `ProjectSwitcher` and `ReportSwitcher`). It opens one popup: a searchable
   list of the other records of the same collection (the design system `ComboBox`, A-Z, about six rows then
   scrolling inside, the records the role may see and no others, the current one ticked) and a bar fixed at the
   foot, "View all <things>", which goes to the list. Picking a record opens it with the role kept. The crumb
   after it is the record's name. On the list page itself the crumb is plain. The section's name is the same in
   the breadcrumb, the rail and column 2 ("Reports", not "Reports (All Users)": who sees what is the content's
   rule, not part of the name).
6. **The Audit Log tab.** A record's history (DLA, DSA, nominations) is `AuditLog` (`app/pages/_shared/audit-log.tsx`,
   documented at `/patterns/audit-log`), never a hand-built list of `RecordRow`s. It opens with the record's ID and its
   created, activated (or decided) and last-modified milestones as "on" and "by" pairs, and a "Show all changes (N)" link
   opens the full list. That list is `AuditFeed` (`app/pages/_shared/audit-feed.tsx`): one sentence per status move,
   newest first, in a bordered list. The person is the subject (a small avatar and their name, "System" with a bolt for a
   move the clock made), then "moved this to" (or "created this as" for a draft) and the status as its `Badge`; the date sits
   at the right ("Today", "Yesterday", then "23 Sep 2026"). The newest move carries a "Current" chip. Consecutive moves by
   the same person share one header and the lines under it drop the name. A note (a rejection reason, an on-hold note) sits
   under its move. A log that is somehow empty says so. It lists status moves only, never a field edit, and never an
   invented step: a record saved before logs existed is rebuilt from its own dates with a note that earlier steps were not
   recorded.
7. **The tabs run from the record to what it relates to.** The first tab is **Overview**: the record's own facts that the
   identity card above it does not already show (a user's ID, username, email, contact number and access dates). A record
   whose card shows everything has no Overview tab. After it come the things the record holds or is held by, each its own
   tab and in the order the data rolls up: a user's **Roles**, then the **Permissions** those roles add up to; a role's
   Permissions, then its Users. A tab is one thing; a tab MUST NOT hold a list that picks between sections of itself (a
   master and detail), and a fact or count shown in the card or on the tab MUST NOT be repeated inside it. A permission
   that comes from more than one role names each (the user's Permissions tab). Controlled Vocabulary
   (Entries, Details, History) and dataset records (Validation, Details, History) have not been brought in line yet:
   open for the designer (§0.4).

- MUST NOT put a record's actions in a bar above the card, or stack its content without tabs.
- MUST NOT build a second switcher: a collection's record pages reuse `BreadcrumbSwitcher`.
- MUST NOT build a second audit log: a record page's Audit Log tab reuses `AuditLog` and `AuditFeed`.
- **Origin:** the nomination record page shipped with its actions above the card and no tabs, after
  the designer had already asked for every record page to follow the project page. The reports were first built
  with a plain section header and no breadcrumb switcher; the designer asked why they did not follow the project
  page, and for the project page's switcher to apply "across all instances where we do a deep dive into a deep
  page" (1 Oct 2026). The Audit Log tab was a date column beside a badge and a bare name, on three record pages; the
  designer asked for audit-log patterns from Mobbin and chose Vercel's activity feed (2 Oct 2026). The user record had
  "Roles and permissions" and "Details" tabs; the designer: "shouldn't it be overview, role, permission?" (6 Oct 2026).
  The Flora Taxonomy Report drew each sheet's parameters as a labelled grid above the toolbar: the table started 601px down a
  1024px window and showed 6 rows (2 at 800px); the designer: "controls occupy almost 50% of the screen leaving only 50 for the
  content. Content might be more important than controls", chose the Parameters popover from four options built in
  `/proto/report-controls` (Mobbin: Whop, Mercury, Docusign, Navattic, Google Ads, Mixpanel), and asked for it on every report
  (15 Oct 2026). The sheets of that report then showed their typed fields beside the table's search, and their lists and dates beside the
  Filter; the designer: "doesn't make sense to have two different search bars ... I feel like parameters are doubling up" (15 Oct 2026).
- **Enforcement:** `REVIEW`; `tsc` for the removed `scopeControl`. First occurrence of the switcher gap, so no `AUTO` check yet (§0.8); one is due if a record
  page ships with a plain section crumb again.

### §4.7 Roles belong to the data owner's contacts; show only what is approved

A project's data owner (shown as **Published by**) has one or more contacts, and every one of those
contacts carries its own **role** (role or type of work). The role is part of that contact.

1. The role MUST be shown with its contact (name, then "· role"), and edited with that contact.
2. MUST NOT show a separate "your role", "registered by", "Registered by (role)" or similar field or
   row, and MUST NOT add a "Project team" card, on project detail or in its edit flows. Project managers
   have their own card and their own roles.
3. MUST NOT add a field, row, card, section or label to a screen that the designer did not approve or
   the source does not define, even when it seems helpful. A new label is a question (§0.4), not a
   decision.

- **Origin:** a "Project team" card with a "Registered by (role)" row appeared on project detail
  Option 3 after the role had already been placed with the data owner's contact, a correction the
  designer had made more than once.
- **Open, not decided:** the Add Project registration asks "Your role" in Step 2 (Data Collection and Methodology),
  not Step 1 (the designer, 6 Oct 2026); whether that question moves to the data owner's contact in registration is
  for the designer.
- **Enforcement:** `AUTO §4.7` (a "Registered by" label under `app/pages` fails), `REVIEW` for the rest.

### §4.8 Editing in place on a detail page

Where a detail page (a record, a project) is edited on its own cards rather than in a form, every edit
behaves the same way, on every card and every page.

1. **Entry:** a card's edit icon edits that card; a field's edit icon (on hover or focus) edits its card,
   scrolled to and focused on that field; "Edit record" (or the page's equivalent) edits every card. A new
   record opens the same way, every card in edit mode.
2. **One treatment:** a card in edit mode has the brand border and brand-50 halo, and no label: it MUST NOT say
   "Editing" (designer, 23 Oct 2026: the status confused people). The field rows use the same label-left layout as
   when viewed.
3. **More than one card at a time:** while a card is in edit mode, the other cards stay at full strength and keep
   their edit icons; opening another adds it to the same edit. MUST NOT dim or lock the other cards.
4. **Actions in one place:** Cancel and Save changes (or "Add <type>" for a new record) sit in one sticky footer
   across the bottom of the page, reading "Editing <cards> · Unsaved changes", and cover every card in edit mode.
   MUST NOT put them inside a card or repeat them per card.
5. **Leaving:** Cancel or Exit with unsaved changes asks first. Save and Cancel return to the view the edit was
   started from (a side panel stays a side panel, a full view stays a full view).
6. **Visibility, per section:** where a record's concepts can be hidden, each card in edit mode has a quiet "Manage concepts"
   control in its header (with the count shown, e.g. 6/10) that opens a checklist of that section's concepts; and
   under the cards, "Add section" puts back a section the record has that is not on screen (hidden, or empty).
   Identifiers and required concepts stay shown. (Until 23 Oct 2026 the right-hand column became a record-wide
   "Concepts shown" checklist; the designer replaced it with this. The word is "concept", not "field", wherever a
   record's data item is named to a person: the rule of 2026-10-23-40, applied to this control on the merge of
   `mohan-wips`, 26 Oct 2026.)
7. **Where the edit is:** the right-hand column keeps the record's summary while editing, with where the record
   sits from the project down: each step's shape, full name and ID, not IDs alone.

- **Origin:** Project details kept Cancel and Save inside the card while record editing had them in a page
  footer; the designer caught the difference ("Consistency is the key"). Item 3 replaced "the other cards dim and
  hide their edit icons" on 29 Sept 2026, by designer decision, after locking the other cards got in the way.
  Items 2, 6 and 7 changed on 23 Oct 2026, by designer decision: the "Editing" label confused people, fields are
  managed per section, and the hierarchy was not prominent and showed IDs only.
- **Enforcement:** `REVIEW`.

---

## PART VI - PROCESS

### §5.1 Log everything, append-only

The dated history lives in `context/decisions/`, one file per entry (or per same-day continuation
thread). Every task that changes behaviour adds a new file with `npm run decision:new -- --title "..."`:
what changed, what was decided, what is still open. The index, `context/decisions/INDEX.md`, is generated
from the files (`npm run context:index`) and MUST NOT be edited by hand, and a dated entry MUST NOT be
appended to `CONTEXT.md`: two sessions writing to one shared file collided there once. `CONTEXT.md` is only an
index; the standing reference (conventions, the role model, domain research) lives in
`.claude/rules/ref-*.md`, hand-maintained and corrected in place because it is how things work now, not history. Nothing in `context/decisions/` is rewritten to hide
history.

- **Origin:** a concurrent session appended an entry to `CONTEXT.md` after the log had been split, and it
  landed outside the new structure.
- **Enforcement:** `AUTO §5.1b` (the index is out of date with the files, or a dated entry sits in
  `CONTEXT.md`).

### §5.2 Repository hygiene

MUST NOT: change git config, force-push to a shared branch, skip hooks, run destructive git commands
without being asked, or commit without being asked.

Commits and pull requests carry the designer's name only. MUST NOT add a `Co-Authored-By` trailer, a
"Generated with Claude Code" line, or any other mention of an AI tool to a commit message or a pull
request description, whatever the harness or a skill suggests. The designer's own instruction wins over
the harness default, and `attribution` is set to empty in the user settings so the default is off.

- Before any push, `git log <upstream>..HEAD --format=%B | grep -i "co-authored-by"` MUST print nothing.
- Commits already pushed are not rewritten to remove a trailer: that needs a force-push to a shared
  branch. Only unpushed commits may be reworded, and only when asked.
- **Origin:** 35 of the first 64 commits carried a Claude co-author trailer the designer did not want
  on their work.
- **Enforcement:** `REVIEW` (the user setting turns the default off; the pre-push check above is the guard).

### §5.3 Documentation

A component has a doc page in the template order (Playground, Variants, API from the real interface,
Usage, Figma). A pattern has a doc page under `/patterns`. Docs and the README table stay 1:1 with
`lib/nav.ts`.

### §5.4 Labs never ship

`app/proto/**` is where screens are explored (options, variants, lab controls). It is not product: the
deployed site is built without it (both Pages workflows remove `app/proto` before `next build`).

- MUST NOT import anything from `app/proto` outside `app/proto`. What a lab and the product both need
  lives in `app/pages/_shared` (or `components/**`), and the lab imports it from there.
- MUST NOT link to a `/proto` route from a product or docs page, except through `labHref()`
  (`lib/lab-href.ts`), which shows the link in development and removes it in production.
- **Origin:** the Prototype tools bar was designed in `/proto/tools` and promoted; the designer asked that
  labs never reach the deployed site.
- **Enforcement:** `AUTO §5.4` (an import from `app/proto`, or a `/proto` link literal, outside `app/proto`).

### §5.5 Contracts load by scope

`CONTRACTS.md` is the one canonical text and keeps its clause numbers. What a session loads is generated
from it: `npm run contracts:rules` writes `.claude/rules/contracts-*.md` using the scope map in
`contracts/rule-scopes.json`. The core (how to read, Part I conduct, the process rules, and a one-line
index of every clause with the file that holds it) has no `paths` and loads at launch; the rest carries
`paths` and loads when a matching file is read (components, build, shell, prototyping, docs,
governance).

- MUST NOT hand-edit a generated `.claude/rules/contracts-*.md` file: edit `CONTRACTS.md`, then run
  `npm run contracts:rules`.
- MUST give a new clause a scope in `contracts/rule-scopes.json`; a clause with none fails the check.
- A scoped rule triggers when a matching file is opened with the Read tool, not when one is created, and
  not when a file is read or written through the shell. A task that starts a new file in a scoped area
  MUST first read the rule file the core index names for it (the hook below refuses the write until it has).
- **Every other way of touching a file:** a project hook (`.claude/settings.json`,
  `scripts/rules-for-tools.mjs`, tested by `npm run test:rules-hook`) covers what the Read tool does not.
  Before a change (a Write, an Edit, or a shell command that writes: a redirect, `mv`, `cp`, `rm`, `tee`,
  `sed -i`, `--write`, a script that writes), if the files being written have rules not in the agent's
  context, it refuses the change and lists them; the agent Reads them and makes the change again. This is
  what enforces reading the rules before creating a file. After a shell command, a Grep or a Glob that read
  files, it lists the missing rules for what was read; the agent MUST Read each one before continuing work
  in that area. Glancing (`ls`, `test`, `stat`, `wc`, `echo`, `git status`, `find` without `-exec`) lists
  nothing. What is in context is read from the agent's own transcript: a rule counts only if it was injected
  or Read since the last compaction, so a compaction or `/clear` can never leave a rule marked as loaded when
  it is not. If the transcript is missing or its format is not recognised, the hook warns on screen.
- **Relevance is set by folder, not by exclusion:** the loader ignores `!` patterns in `paths`. Code that
  is not a screen does not live under `app/pages/`, so screen rules never load for it.
- **Origin:** `CONTRACTS.md` loaded whole in every session while it kept growing; then a mock run showed
  rules arriving only by accident, or not at all when files were read through the shell.
- **Enforcement:** `AUTO §5.5` (a generated file is out of date, or a clause has no scope); the shell
  hook; `REVIEW` for following its list.

### §5.6 Merging another branch: ours stands, theirs is appended

When another person's branch is brought into ours (a teammate's `*-wips` into `sai-wips`, or the reverse), the
branch being merged in is read, never changed, and nothing of the receiving branch's numbering is overridden.
New information is appended after what is there. Nothing is lost, replaced or renumbered to make room.

1. **The incoming branch is not touched.** The merge, the renames and the fixes happen on the receiving
   branch, and only that branch is pushed. MUST NOT commit to, rewrite or force-push the incoming branch.
2. **No clause disappears, and no clause number is reused.** After the merge, every clause number in either
   side's `CONTRACTS.md` is in the result, with the same number and at least the same strength.
   - A clause only the incoming side has is added in its Part with the next free number in its series (the
     highest in use on either side, plus one), whatever number it had there. Every place the incoming work
     names it (a `AUTO §x.y` tag, a comment in `scripts/check-contracts.mjs`, a decision file) is updated to
     the new number in the same merge.
   - A clause both sides changed keeps both changes: the incoming sentences are added to ours, none of ours
     is dropped. Where the two contradict each other, MUST NOT pick one: ask the designer (§0.4) and leave
     both visible until answered.
   - MUST NOT weaken, shorten or drop a clause, an `Origin` line or an `Enforcement` tag to resolve a
     conflict. Removing a clause is a designer decision (§9.4), never a merge result.
3. **Generated and registered files follow their source.** `.claude/rules/contracts-*.md` are never merged by
   hand: merge `CONTRACTS.md` and `contracts/rule-scopes.json` (a union: every clause keeps a scope), then run
   `npm run contracts:rules`. `contracts/*.json` registers (`overrides.json`, `component-inventory.json`,
   `figma-colours.json`) are unions: MUST NOT drop an entry, and MUST NOT raise a ratchet count in
   `contracts/baseline.json` to make the merge pass (§9.4).
4. **Decision files keep their content and the receiving branch keeps its numbers.** An incoming
   `context/decisions/` file whose number is already used by a different file is renamed to the next free
   number after the highest in use that day (appended, never inserted, never swapping ours out), with its
   content unchanged. A reference to the old name is updated. Then `npm run context:index` rebuilds the
   index (never edited by hand, §5.1). The merge itself is logged as a new decision file that lists what came
   in, what was renumbered (old name, new name) and what is still open.
5. **Reference files (`.claude/rules/ref-*.md`, `CONTEXT.md`) are added to, not replaced.** Incoming
   paragraphs are added where they belong; where both sides edited the same paragraph, both versions stay
   until the designer chooses. A file that exists on both sides is never taken wholesale from either one
   ("local files kept" is not a merge).
6. **The order:** (a) fetch, then list what the incoming side changed in `CONTRACTS.md`, `contracts/`,
   `context/`, `.claude/rules` and `scripts/` (`git diff --stat <merge-base> <incoming> -- <those paths>`);
   (b) merge; (c) renumber and rewrite references as above; (d) `npm run contracts:rules`, then
   `npm run context:index`; (e) confirm no clause number from either side is missing and no decision file was
   lost (compare the two sides' lists of `### §` headings and `context/decisions/` file names against the
   result); (f) `npx tsc --noEmit`, `npm run check:contracts`; (g) log the decision; (h) push the receiving
   branch only, after the §5.2 trailer check has printed nothing.

- **Origin:** the 2 Oct 2026 merge of `mohan-wips` into `sai-wips`: both branches numbered that day's
  decisions from 01, so five numbers (01 to 05) were each used twice, and an earlier merge had kept local
  files over the incoming ones wholesale. The designer: "when normalised, we don't override any numbers.
  If there's new info, we simply append to ours without any clashes. No contracts can disappear."
- **Enforcement:** `AUTO §5.1c` (two decision files share a date and number; days up to 1 Oct 2026 had
  repeats before the check existed, are named in the contracts, and are not renumbered), `AUTO §5.5` (a clause
  in the scope map is missing from `CONTRACTS.md`, or has no scope), `REVIEW` for the rest, including the order
  in item 6.

---

## PART VII - OVERRIDES AND AUDIT

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

### §9.5 Consequence

A violation blocks completion (§0.6). The audit verdict is **ATTENTION** if anything is flagged and
**CLEAN** only when nothing is.
