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

1. `CONTRACTS.md` is binding. `CONTEXT.md` is the dated history of how the system got here; where the two
   disagree, this file wins and `CONTEXT.md` is corrected in the same task.
2. An explicit instruction from the designer in the current session may override a clause. When that
   happens the agent MUST (a) name the clause being overridden, (b) log the override in `CONTEXT.md`, and
   (c) if the clause is §1.4 or §9, record it in `contracts/overrides.json`. One override is never a
   precedent for the next task.
3. Nothing in `CONTEXT.md` may be used to justify a violation of this file.

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
- Real organisations come from the BDBSA research in `CONTEXT.md` (BirdLife Australia, Birds SA, South
  Australian Museum, ...). Never invent a partner.
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
6. A dated entry appended to `CONTEXT.md` (append-only, no em-dashes).
7. `git status` after any CLI ingest: a CLI run can silently revert already-fixed files.

- **Enforcement:** `REVIEW` (item 3 is `AUTO`).

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
swapped, the gap table and mapping table updated, `CONTEXT.md` corrected.

### §1.4 A new component is a designer override, with checks and balances

Creating a component is the one act that changes the design system itself. It MUST NOT happen as a
side effect of building a screen.

1. **Who:** only the designer may authorise it, explicitly, for that component.
2. **Record:** before the component file is committed, an entry MUST exist in
   `contracts/overrides.json` with `component` (path), `designer`, `date`, `reason` (why no existing
   component works, and which were checked), and `approvedBy`. Use `npm run contracts:override`.
3. **Inventory:** the file is added to `contracts/component-inventory.json` by
   `npm run check:contracts -- --update-baseline`. Doing that is itself an audited act (§9.4).
4. **No twin:** it MUST NOT duplicate the job of an existing component (§1.7).
5. **Tier:** it starts in `components/custom/**` until promoted (a move, not a rebuild).
6. **Audit:** it is listed in the next audit report under "New or changed components" with its override
   status. A component without an override record is flagged **VIOLATION**.

- **Enforcement:** `AUTO §1.4` (a component file not in the inventory and without an override fails the
  check), `AUDIT`.

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
- **Enforcement:** `AUTO §2.1` (known-dead classes and hard-coded colours, ratcheted against
  `contracts/baseline.json`: existing debt may not grow).

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

- Exempt by name: `app/pages/biodata-home` (marketing) and `app/pages/auth/**` (auth flow).

### §3.8 Floating dev tools

The role switcher and the options control are `FloatingMenuFab`s: draggable, above every map overlay
(`z-[10000]`), and MUST NOT be compensated for with padding or margin in product layout.
Modals and slide-over panels sit above them (`z-[20000]`, `lib/layers.ts`): a modal covers everything,
the dev tools included.

### §3.9 Navigation order

`lib/nav.ts` `Components` and `config/design-system.config.ts` keys are strictly A-Z. A new entry is
slotted, never appended. If either list is found out of order, the whole list is fixed. (`Primitives` and
`Patterns` follow a foundations-first order and are exempt.)

---

## PART V - PATTERNS

### §4.1 The form pattern

Every create or edit form (Add Project option 2, DSA, DLA, and any new one) MUST render `<FormPage>`
(`app/pages/_shared/form-page.tsx`) with fields laid out in `<FormRow>`. Documented at `/patterns/forms`.

1. **Header:** an optional eyebrow, the title (with a status badge for an existing record), a one-line
   subtitle, and the header actions **Cancel** and **Save draft**. Save draft is omitted when a draft makes
   no sense (editing a live record).
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
5. **Footer:** **Back a step** (secondary, left arrow icon) on the left, hidden on the first section. The
   primary action on the right: **Continue** (right arrow icon) to move on, or the final action (**Submit**,
   **Create project**, **Save changes**) on the last section. 
6. **Leaving:** Cancel asks before discarding unsaved changes (`ConfirmationModal`), and says what will be
   lost.
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

---

## PART VI - PROCESS

### §5.1 Log everything, append-only

`CONTEXT.md` is an append-only dated log. Every task that changes behaviour adds an entry: what changed,
what was decided, what is still open. Nothing is rewritten to hide history.

### §5.2 Repository hygiene

MUST NOT: change git config, force-push to a shared branch, skip hooks, run destructive git commands
without being asked, or commit without being asked. Commit messages end with the attribution line in use.

### §5.3 Documentation

A component has a doc page in the template order (Playground, Variants, API from the real interface,
Usage, Figma). A pattern has a doc page under `/patterns`. Docs and the README table stay 1:1 with
`lib/nav.ts`.

---

## PART VII - OVERRIDES AND AUDIT

### §9.1 Overrides

A clause may be overridden only by an explicit, named instruction from the designer (§0.1). An override
is scoped to the task, logged in `CONTEXT.md`, and for component creation recorded in
`contracts/overrides.json` (§1.4).

### §9.2 The override register

`contracts/overrides.json` lists every authorised new component: `id`, `component`, `designer`, `date`,
`reason`, `approvedBy`, `status` (`active`, `promoted`, `retired`). It is reviewed in the audit.

### §9.3 The audit

`npm run audit` writes `audit/audit-YYYY-MM-DD.md`. It compares this branch with `main` and reports:
what happened on main, what is local only, contract-check results, new or changed components with their
override status, duplicate components, open `<Gap>` markers, token and utility changes, added and removed
routes, changes to the contract files themselves, and the verdict. It runs at the end of every working
day and on a schedule in CI (`.github/workflows/design-system-audit.yml`).

### §9.4 Guarding the guard

A change to `CONTRACTS.md`, `contracts/*.json`, or `scripts/check-contracts.mjs`, including updating the
baseline or inventory, is itself flagged in the audit. Loosening a rule, raising a baseline count, or
removing a clause MUST be an explicit designer decision recorded in `CONTEXT.md`.

### §9.5 Consequence

A violation blocks completion (§0.6). The audit verdict is **ATTENTION** if anything is flagged and
**CLEAN** only when nothing is.
