---
paths:
  - "/app/**"
  - "/components/**"
---

<!-- GENERATED from CONTRACTS.md by scripts/build-contract-rules.mjs (CONTRACTS.md 5.5). Do not edit: change CONTRACTS.md, then run `npm run contracts:rules`. -->

# DEW contracts: build

Tokens, type, copy, icons, Figma, components in use, behaviour patterns. Full text and numbering: CONTRACTS.md.

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

### §3.12 Every action button carries an icon

Every action button MUST carry an icon that names its action: on the left of the label (`iconLeading`), or a
forward arrow on the right (`iconTrailing`) for a button that moves on. An action button is a filled or outlined
`Button` with a text label: `primary`, `secondary`, `tertiary` or a destructive colour.

- **Not action buttons.** An icon-only button (an `aria-label`, no text) and a link-style button (`link-color`,
  `link-gray`, `link-destructive`) are not covered; they may still carry an icon.
- **One icon per action (§2.4).** The same action has the same icon on every screen. Workflow actions on a record
  (`RecordAction`, whose `icon` is required) and the buttons in forms, modals and the auth flow use this set:

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
  (designer, 1 Oct 2026, section 0.8).
- **Enforcement:** `AUTO §3.12` (an action button with no icon anywhere under `app/pages`, the auth flow and the
  home page included, or in `components/application`, `components/base` and `components/custom`; the two stale
  unlinked drafts are exempt), and `tsc` for `RecordAction.icon` and the modals' required icon props.
