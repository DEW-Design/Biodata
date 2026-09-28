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

## PART III - STYLE

### §2.1 Tokens only

Colour, spacing, radius, shadow and type come from the `--ui-*` layer in `app/globals.css`.

- MUST NOT hard-code hex, rgb or rgba in product code.
- MUST NOT use a utility that is not defined. Known-dead and therefore prohibited: `text-md`,
  `bg-quaternary`, `bg-border-secondary`, `border-secondary_hover`, `border-l-brand-solid`,
  `border-error-subtle`, `selected:` variants, `ring-offset-bg-primary`. Add the utility to `globals.css`
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
- **Enforcement:** `AUTO §2.3` (em-dashes and arrow characters, ratcheted).

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

---

## PART IV - THE SHELL (persona-consistent)

### §3.1 One header

Every real `/pages/**` screen renders `<AppHeader />` and nothing else at the top. It MUST NOT be
hand-rolled, copied, or wrapped to change what it shows.

- **Enforcement:** `AUTO §3.1`.

### §3.2 One rail, one icon map, one footer block

Column 1 is `<PrimaryRail />`, icons come from `nav-icons.ts`, column 2 ends with `<SidebarFooterLinks />`.

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
always exists and always says something about where you are.

- Exempt by name: `app/pages/biodata-home` (marketing), `app/pages/auth/**` (auth flow) and `app/pages/page.tsx`
  (the `/pages` screen index, a directory of screens rather than one).

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
`Patterns` follow a foundations-first order and are exempt.)

### §3.10 Column 2 is navigation and actions only

The contextual sidebar (column 2) holds where you are and what you can do from here: a section label, a
list or tree or scope switch that moves you around, the Actions group (export, report), and the footer
links. It MUST NOT hold information: no explanatory copy, no steps or explainers, no alerts, task cards
or accordions. Information sits in main, above the content it explains.

- **Exception:** the public-user (signed-out visitor) column 2, which explains what BioData SA is and
  points to guides (`GuestAboutAside`). No other persona and no other screen.
- **Origin:** the nominations list put a "How a nomination is reviewed" steps explainer in column 2.
- **Enforcement:** `AUTO §3.10` (an `<aside>` in `app/pages` containing a heading, Progress steps, alert,
  accordion or task card, except the public-user file). It catches structural information only; prose in
  a plain paragraph is `REVIEW`.

---

## PART V - PATTERNS

### §4.1 The form pattern

Every create or edit form (Add Project option 2, DSA, DLA, and any new one) MUST render `<FormPage>`
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

- **Exempt:** Add Project option 1 (a stakeholder option, one question per card).
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

### §4.3 Cognitive load

More than five or six field groups needs tiering. A conditional field is conditional in the UI. One focal
point per view. Never restate a fact in two treatments on one screen. When load and one extra click are in
tension, take the click.

### §4.4 Options

`option-1 ... option-n` routes are what designers present to stakeholders while a screen is being
explored. When a direction is chosen the others are deleted. A comparison is presented through
`LayoutOptionSwitcher`.

### §4.5 Generated screens

`/test-*` screens prove a Figma frame maps onto the library: every contained widget is real or `<Gap>`,
they ship the token inspector, and their own content is Barlow. `/pages/*` screens have none of that
apparatus.

### §4.6 Record pages follow the project page

Every record page (a project, a DLA, a DSA, a nomination, a user, role or permission, and any new
record) is laid out like the project page (`/pages/project-detail`):

1. A Back link on its own above the card (`RecordBackLink`).
2. The gradient identity card (`RecordHero`): eyebrow, title, a row of label/value facts, and the
   record's actions at its top right (`RecordActionBar onDark`): one button for the next step, every
   other action in the "..." menu, destructive ones below a divider.
3. Optionally, one notice saying where the record stands and who acts next.
4. Underline `Tabs`, each panel a bordered card of label/value rows (`RecordRow`).

- MUST NOT put a record's actions in a bar above the card, or stack its content without tabs.
- **Origin:** the nomination record page shipped with its actions above the card and no tabs, after
  the designer had already asked for every record page to follow the project page.
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
