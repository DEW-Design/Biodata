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
