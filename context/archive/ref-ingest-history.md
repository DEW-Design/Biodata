# Archive: .claude/rules/ref-ingest.md as it stood on 2026-09-29, before the rewrite

Not loaded into sessions. The whole file, verbatim, from before it was cut down to current practice (context/decisions/2026-09-29-35). Parts were no longer true: it pointed to `app/components/avatar/page.tsx` (now under `app/(docs)/`), to "Final check" and "Known gaps" sections that no longer exist, to `dashboard/option-1`, and said `SegmentedControl` stands in until a DEW `Select` or `Toggle` exists (both exist). Read it for the incidents behind each QA item, never for how to ingest now.

<!-- Moved verbatim from CONTEXT.md on 2026-09-29, unchanged. Hand-maintained: edit in place. -->

# Reference: ingesting components, doc pages and generated screens

How a component is ingested and QA'd, the doc-page template, DEW vs Scaffold, Figma as source of truth, generated /test-* screens, custom components. Rules live in CONTRACTS.md; this is the reasoning and the how-to behind them.

## Figma is the source of truth

When a Figma frame documents a component DEW has already ingested, Figma wins - full stop.
Apply every trim this section calls for directly, in the same pass as the audit - don't flag an
undocumented variant and wait for a decision, the same way a font-barlow regression or a wrong
token value gets fixed on sight, not logged as an open question. The entire point of a Figma
cross-check is narrow: confirm the shipped styling matches the brand guide. It is not licence to
add scope, invent variants, or judge whether an undocumented type/colour might be intentional -
if Figma doesn't show it, it doesn't get demonstrated, and that's the whole decision.
That means, whenever a Figma reference is available for a component:

- **Check every variant DEW demonstrates against what Figma actually defines** - sizes, types,
  states. If DEW shows a variant Figma doesn't document (e.g. a size that exists in the
  component's TS type because Untitled UI ships it, but was never given a Figma variant), don't
  demonstrate it in the Variants/Sizes sections - trim it to match. The API table is the one
  exception: it documents the real prop signature regardless of what's demoed, per "never invent
  or drop a prop" below.
- **Colours, spacing, and states documented in Figma override whatever's already in code.**
  Precedent: `Select`'s Figma documentation frame (node 65:1317) showed every field-style
  component's Focused state using a 2px `border-brand` (`#2A667C`, brand-500) - a strong,
  saturated ring - while DEW's shipped `ring-brand` token was brand-300 (a pale tint) on
  `Input`, `Select`, `ComboBox`, `MultiSelect`, `TagSelect`, and `PinInput` alike. Fixed by
  changing the semantic token (`--ui-ring-brand` and `--ui-ring-border-brand` in `globals.css`),
  not by patching each component - one token, every consumer corrected at once.
- **A missing Figma swatch for a state doesn't mean delete the state.** Figma has to draw
  Default/Hover/Focused/Open as separate static swatches because it's static; DEW's doc pages are
  live, so hovering/clicking/tabbing a real component already demonstrates every state - there's
  no need to build a matching static "Focused" section just because Figma has one. Only the
  sizes/types/props actually differ in kind between the two; states are just interaction, and
  interaction is free on a live page.
- **An implementation that can't be drawn in Figma (a real `<select>`, native OS-rendered UI)
  isn't automatically "not needed."** `NativeSelect` has no Figma swatch - browsers render
  `<select>` themselves, so there's nothing to mock - but it's still a real, CLI-ingested
  component serving a real technical need (native form behaviour, e.g. inside an `InputGroup`).
  Absence from a Figma page only means "trim this" when the thing itself is drawable and Figma
  chose not to draw it (a size, a type). Don't confuse "un-drawable" with "unwanted."

## DEW vs. Scaffold

Moved to `.claude/rules/ref-scaffold.md` (it also loads for labs and the Prototype tools bar).

## New component workflow

```
Ingest component props        Attach primitives        Check simple           Create component        Create                  Run QA
from Untitled UI          →   (styled)             →    or complex        →   playground          →   documentation      →    check
(unstyled)                                              (strict)                                                              (non-negotiable)
```

1. **Ingest** - install via the Untitled UI CLI (`npx untitledui-cli@latest add <component>` or
   equivalent). This drops raw, unstyled-in-our-system component files into `components/base/<name>/`.
2. **Attach primitives** - verify every class the installed component uses resolves through
   this repo's token chain: `--ui-*` semantic vars in `app/globals.css` → `--color-*` primitives.
   Grep the new files for hardcoded hex/rgba - there should be none. If a utility class
   (`bg-tertiary`, `text-fg-quaternary`, `ring-secondary_alt`, …) doesn't exist yet in
   `globals.css`, add it there rather than inlining a colour in the component.
3. **Check simple or complex**:
   - **Simple** - a single primitive, forms the basis for complex components, inherits
     tokens directly. Example: `Avatar`.
   - **Complex** - a combination of 2+ simple components (including primitives).
     Example: `AvatarLabelGroup` (Avatar + text), `AvatarProfilePhoto` (Avatar variant + status/verified badges).
   - This classification doesn't change how the component is documented, but it changes
     what the "Usage" snippet should show - a complex component's snippet should compose
     from the simple one, not duplicate its internals.
4. **Create component playground** - an interactive live instance at the top of the doc
   page. See "Playground pattern" below.
5. **Create documentation** - Variants (config-driven, see below), API table (pulled from
   the real prop interface, never invented), Usage snippet, Figma link. This is also what
   "forms basis for creating prototypes" refers to in the source workflow diagram - the
   playground + docs together are the reference a prototype gets built from.
6. **Slot it in, alphabetically.** Add the route folder, a `config/design-system.config.ts`
   entry, and a `lib/nav.ts` entry - each inserted in strict A-Z order among the existing
   `Components`, not appended at the end. See "Final check" above.
7. **Run the QA check.** Non-negotiable, every ingest, no exceptions - see "QA check" below. A
   component isn't done at step 6, it's done when step 7 passes clean.

## QA check (non-negotiable, post-ingestion)

Every component ingest - a brand-new component or a real change to an existing one - ends with
this checklist, run and passed clean, before the task is reported done. This isn't optional and
isn't a "nice to have if there's time" - it's the same category of contract as the alphabetical
slotting rule or the Figma-source-of-truth rule above: a task that skips it is not finished, no
matter how complete the component otherwise looks. Every item below exists because it already
caught a real, shipped bug this repo hit at least once - this list is a record of failure modes,
not a hypothetical.

1. **`tsc --noEmit` clean.** Catches import/prop-shape mismatches, but nothing else below -
   a component can type-check perfectly and still be visually broken.
2. **`npm run lint` clean on every file touched.** Scoped to the files the ingest actually
   changed, not a demand to fix this repo's pre-existing lint debt elsewhere. Caught after the
   fact once already: `Dropdown`'s ingest shipped two empty `interface X extends Y {}`
   declarations (`@typescript-eslint/no-empty-object-type`) and the Table doc page shipped
   several unescaped `'`/`"` characters in JSX text (`react/no-unescaped-entities`) - both real,
   both would have been caught immediately by running lint, and neither was caught by `tsc`
   alone. Fixed by converting the empty interfaces to type aliases and escaping the quotes -
   **`tsc` clean is not the same as done; run lint too, every time.**
3. **Every utility class the new code uses actually exists in the live `app/globals.css`.**
   A class name "looking like" a real Tailwind/DEW token is not verification - grep it or check
   the compiled CSS. This repo hand-curates its own `@utility` layer rather than relying on
   Tailwind's automatic `bg-*`/`text-*`/`border-*` generation, so a CLI-generated component
   reaching for a plausible-sounding class can compile clean and render as a silent no-op.
   Precedent, all found this way: `tree-view.tsx`'s connector lines used `bg-border-secondary`
   and `border-border-secondary`, neither a real utility (transparent line, wrong-coloured
   elbow); `table.tsx`'s row-selection highlight used `selected:bg-secondary`, a
   `tailwindcss-react-aria-components` plugin variant that's only registered in an orphaned
   `styles/globals.css` nothing imports (fixed to the core-Tailwind `aria-selected:` variant
   instead); `text-md`, used everywhere in this codebase including `Table`/`Modal`/`Checkbox`, is
   not defined anywhere in the live `app/globals.css` at all and silently compiles to nothing -
   a sitewide gap larger than any one ingest, flagged rather than fixed in every file at once,
   but every *new* component must not add another use of it.
4. **Portaled content (`Modal`, `Popover`, `Dropdown`'s menu, anything React Aria renders into
   `document.body`) carries its own `font-barlow` explicitly.** A portal escapes the DOM
   position of whatever rendered it, so it can't inherit a font from the page around its
   trigger - it falls back to the site default (Geist) instead. Every real DEW component this
   session shipped without it (`Modal`'s `Dialog`, `TreeView`, `Select`/`ComboBox`/`MultiSelect`/
   `TagSelect`/`NativeSelect`, `Toggle`, the custom `DateRangeControl`, both `Table`s, `Dropdown`'s
   popover) had to be fixed after the fact, caught by the user screenshotting Geist text next to
   Barlow text in the same component. Check this on sight for every new component, not just the
   one a screenshot happens to catch.
5. **No real component's own semantic markup (`<h1>`-`<h6>`, `<p>`, etc.) silently inherits a
   doc-site-only global rule.** This repo's `.prose-doc h2`/`.prose-doc h3` rules apply to any
   heading at *any* depth inside `.prose-doc` (no `>` child combinator), not just the docs
   prose's own headings - so a real component's title, rendered as a bare `<h2>` inside a doc
   page, silently picks up 48px top margin and the wrong font-size. Caught on `TableCardHeader`:
   its badge appeared to float above the title instead of sitting beside it, because the `<h2>`'s
   inherited top margin pushed it down within the flex row. Fixed with explicit `!` overrides
   on the component's own heading rather than relying on inheritance - the same "component must
   not depend on ambient page context" principle as font-barlow above, just via a doc-site global
   instead of a font default. Check every new component's headings/paragraphs render identically
   whether mounted inside `.prose-doc` or standalone.
6. **Any real component copy that can wrap to two or more lines carries `text-balance`
   (`text-wrap: balance`) - a title, description, heading, subheading, label, or hint, never a
   single-line/`truncate`/`whitespace-nowrap` field.** See `/primitives/typography`'s "Text
   wrapping" section - this was already the unstated convention for every doc-page heading/
   paragraph inside `.prose-doc`, made explicit and extended to the real component layer per
   direct user request. Applied this pass to `Modal` (all 3 variants' title+description),
   `AlertFloating`/`AlertFullWidth` (title+description), `ToastCard` (title+description),
   `SectionHeader` (Heading+Subheading), `Accordion` (item title), `Tooltip` (title+description),
   `Checkbox`/`RadioButton`/`Toggle` (label+hint), and all 6 `radio-groups` layouts (title/
   description, skipping the name+secondaryTitle pairs that sit inline in one row by design).
   Every *new* component with a title/description/label/hint-shaped prop needs the same check.
7. **A live browser render, not just a code read.** Start the dev server, open the doc page (or
   every `/pages/*`/`/test-*` screen using the component), and actually interact with every
   documented state - open the modal, expand the dropdown, toggle the selection, sort the
   column - via a real headless-browser pass (Playwright), checking for zero console/page errors
   and confirming computed styles (`getComputedStyle`, not assumed from the className) match
   intent. A component can look correct from the source and still be broken at runtime - most
   items above (the dead utility classes, the font-barlow gaps, the prose leak) were only ever
   caught this way, never by reading the JSX.
8. **If a Figma frame exists, the shipped styling is audited against it directly, on this
   pass - not deferred.** See "Figma is the source of truth" above; this QA check is one of the
   points in the workflow where that audit is expected to happen, not an optional follow-up.
9. **If a bug is found, grep sibling/dependent files for the same pattern before calling it
   fixed.** A bug caught in one file is often shipped in more than one - `selected:bg-secondary`
   was wrong in both `components/base/table/table.tsx` and `components/application/table/
   table.tsx`; the `font-barlow` gap above was never a single-file fix. Fixing the one instance
   a screenshot happened to catch and stopping there is not passing this check.
10. **Any genuinely separate, larger issue this pass surfaces gets logged under "Known gaps"
   below, in the same session - not silently dropped, not silently expanded into scope.** The
   `text-md` sitewide gap and the "Action icons"/"Action buttons" row-action patterns Figma
   documents but this repo hasn't built yet are both this shape: real findings, correctly not
   fixed on the spot because they're bigger than the ingest that surfaced them, and both are
   logged in "Known gaps" rather than left to be rediscovered cold next time.

## Doc page template (established on `app/components/avatar/page.tsx`)

Every component page follows this order:

1. `PageHeader` (title, description, and a `Config` action button - see Contextual config below)
2. **Component Playground** - live instance + controls
3. **Variants** - one `<h2>` + `Section` per demonstrable prop/state, each gated by
   `isFeatureEnabled(config, "<key>")` so it can be hidden from `config/design-system.config.ts`
   or the live `/config` page
4. **API** - props table sourced directly from the component's TS interface. Never invent a
   prop or drop one because it's inconvenient to demo - see "Known gaps" below for what to do
   when a documented prop doesn't actually do anything.
5. **Usage** - a real import + minimal JSX snippet
6. **Figma** - link if one exists, otherwise an honest placeholder (most components installed
   via the CLI don't have one yet - don't fabricate a link)

`Sizes` and `API` are always visible (foundational reference, not optional). Everything else
is a "section" and gets a `features` key.

### Config-driven variants

Doc pages never hardcode which colours/sizes/types/sections appear - they read from
`config/design-system.config.ts` via `enabledVariants()` / `isFeatureEnabled()`, and that config
is live-editable through `useConfig()` (`lib/config-context.tsx`), persisted to `localStorage`.
Adding a new demo section to a page means adding a `features` key in the config first, then
gating the JSX with `isFeatureEnabled(config, "thatKey")` - not the other way round.

### Contextual config panel

Each component page also exposes a per-page "show/hide sections" panel (`components/ContextualConfigPanel.tsx`),
triggered by the `Config` button in the page header (`PageHeader`'s `actions` slot). It lists
every `features` key for that component slug and toggles it through the same `setFeatureEnabled`
used by the global `/config` page - it's a scoped shortcut, not a separate state model. This means:
**every `features` key doubles as a panel toggle automatically** - name the key to match the
section's heading (e.g. `companyIcon` → "Company icon") so the panel reads sensibly with no
extra mapping table.

### Playground pattern

A single bordered card, split into a dot-grid canvas (left, the live DEW component) and a
controls panel (right, ~300px). The canvas is the only DEW surface in the whole card - the
controls panel is entirely built from `components/scaffold/controls.tsx`
(`ScaffoldTextInput`, `ScaffoldNumberInput`, `ScaffoldCheckbox`, `SegmentedControl`,
`ScaffoldLabel`, `ScaffoldButton`), never from real `Input`/`InputNumber`/`Checkbox`/`Button`,
per "DEW vs. Scaffold" above: a control that operates the demo is Scaffold even when a matching
DEW component exists. `SegmentedControl` additionally stands in for size/status selection until
a real DEW `Select`/`Toggle` exists (see Known gaps). Preview state is local `useState` in the
page, seeded from sensible defaults, with a `Reset` action; the *options* the controls offer
(e.g. which sizes are selectable) come from the config, not local hardcoding, so the playground
and the Variants section below it never drift apart. The canvas styling (dot-grid, card shell)
still lives inline in `avatar/page.tsx` - when rolling this template out past Avatar, extract it
into `components/scaffold/` alongside the controls rather than re-pasting.

## Generated screens (Figma → code mapping)

A generated screen (e.g. `/test-page`, built by mapping a Figma test frame to real components) is
a different animal from a doc page - it's neither a Playground's DEW-only canvas nor Scaffold
tooling, it's a reconstruction of an actual product screen. Two rules specific to this workflow:

- **No match, no substitute - and no silent drop either.** Map every Figma layer against the
  installed component library first (`components/base/**`, `components/application/**`,
  `components/foundations/**`). If a real match exists, use its exact API - no improvising. If no
  DEW component exists for a given Figma layer (a searchable select, a stepper, anything that
  isn't shipped yet), do **not** fake it with a lookalike built from a different component, and do
  **not** quietly omit it from the screen either. Render a visible `?` placeholder in the screen at
  that exact position, so the gap is obvious in the rendered UI itself, not just buried in a table
  underneath it. Then also log it in a mapping/gap table below the screen - the placeholder answers
  "where," the table answers "what" and "why it's missing." Development of the rest of the screen
  continues regardless; a gap is flagged, never a blocker.
  - This only applies to actual UI elements/controls. Plain, non-interactive Figma text layers
    (a heading, a wordmark, helper copy) were never components to begin with - render those as
    text, they don't need a `?`.
  - **Contained widget vs. structural shell - the `?` only replaces the former.** A missing
    *contained* control (a Radio, a Textarea - one field among many) gets the `?` treatment above.
    A missing *structural* pattern that organizes the whole screen (an Accordion wrapping every
    section) does not - `?`-blocking it would swallow everything inside it, defeating the point of
    building the screen at all. Compose the structural shell from real tokens instead (e.g.
    `border-brand-100` / `text-brand-tertiary` for an Accordion), keep every real DEW component
    inside it working normally, and log the shell itself in the mapping table as "composed, not a
    real component" - a candidate for future ingest, not a blocker. Precedent: `/test-site-details`
    (Figma node 88:11339) - Accordion is used identically 5× across the frame; Radio and Textarea
    are single fields within it and got the `?` marker as normal (both have since been resolved -
    see the flow-through rule below).
- **A `?` gap is not "done" once flagged - it's done once replaced, and that has to happen the
  moment the missing component lands, not eventually.** Whenever a component gets newly ingested
  into `components/base/**` (or any other DEW layer), immediately grep every `/test-*` page for a
  gap marker it resolves (`GapRadio`-style local components, `?` placeholder cards, "Still open" /
  "not blocking" gap tables) and swap the placeholder for the real component in the same pass -
  don't wait to be asked per screen. Update three things together, not just the visible markup:
  the gap summary table/cards (move the entry from "open" to resolved, or remove it), the
  `mapping` table (add a row documenting the real component, same as any other matched layer), and
  `CONTEXT.md`'s own gap log if the ingest was recorded there. Precedent: `/test-site-details`'s
  Radio field was `?`-blocked (`GapRadio`, a local dashed-circle placeholder driving real
  `locationMode` state) until `components/base/radio-buttons/**` was ingested this session - the
  placeholder was replaced with the real `RadioButton`/`RadioGroup` (wrapped in `Inspectable`, same
  as every other real component on that screen), the gap-cards list dropped Radio, and the mapping
  table gained a row for it. More generally: **any component-level change** (a prop added, a token
  fixed, a visual bug corrected - not just a brand-new ingest) must flow through to every `/test-*`
  page using that component, the same session it's made, not as a follow-up. A `/test-*` page is a
  live reconstruction of a product screen, not a snapshot - it has to stay honest about the design
  system's current state, or the whole point of the token-inspector cross-check breaks.
- **A generated screen's own content is Barlow end to end, including its plain text.** The
  "Scaffold labels are Geist, DEW components are Barlow" rule above is about doc-page chrome vs.
  the component being demonstrated. A generated screen is neither - it's real product-screen
  content, so every text node inside it (including plain text that isn't rendered by a DEW
  component, e.g. a page heading or a wordmark sitting next to a real `Input`) should carry
  `font-barlow`, to match what the product typeface would actually look like. Only the *doc
  page's own* chrome around the screen (its `PageHeader`, its mapping table, its prose) stays
  Geist. Caught once already: `/test-page`'s "Sign in to your account" heading and its footer
  helper text rendered in Geist because they had no explicit font, inherited the site default,
  and visibly mismatched the Figma spec (all-Barlow) even though every DEW component on the same
  screen was already correct.
- **Every `/test-*` generated screen ships the hover token-inspector, togglable.** This is
  standing infrastructure, not a one-off - `components/scaffold/token-inspector.tsx` exports
  `InspectorProvider` (wrap the whole page in it) and `Inspectable` (wrap each element you want
  inspectable in it, with a `label`/`source`/`tokens` trace pulled from the real component
  source - never approximated). Hovering an inspectable element rings it and shows a tooltip of
  every utility class it applies, the semantic variable each resolves through, and the resolved
  value - a live cross-check that the screen isn't hardcoding anything outside the token chain.
  `InspectorProvider` renders a floating "Inspector: On/Off" button (bottom-right) that toggles
  the overlay for the whole page, so a reviewer can see the screen clean when they want to. The
  wrapper `<div>` around each `Inspectable` child (and its `className`, e.g. a layout-critical
  `w-full`) always renders regardless of the toggle state - only the ring+tooltip overlay nodes
  are added/removed - so toggling the inspector off never shifts layout. Any new `/test-*` page
  must be built with this from the start, not bolted on after.

## Custom components (`components/custom/**`)

A `?`-blocked gap marker (see "Generated screens" above) is the default for a widget with no real
DEW match - honest, but inert. Once a gap's shape is clear enough to actually build (real
interaction, not a static mock), it can graduate into `components/custom/<name>/` instead of
staying `?`-blocked forever. This is a third tier alongside `components/base/**` and
`components/application/**`, for exactly one purpose: real, working components that don't have a
stakeholder-decided home yet.

- **Still built from real primitives - react-aria, existing DEW components (`Popover`, `Button`,
  etc.) - never invented from scratch.** The bar for *how* it's built doesn't drop just because
  it's not officially adopted yet; only the "is this locked into the design system" question is
  still open.
- **Documented under the "Custom Components" nav section (`/custom-components/<name>`), not
  "Components".** Same doc-page apparatus (`PageHeader`, an API table, a usage snippet) but lighter
  - no `config/design-system.config.ts` entry, no live variant-driven playground - since there's
    nothing to configure yet for a component whose API isn't settled. See
  `app/(docs)/custom-components/date-range/page.tsx`.
- **Promotion is a move, not a rebuild.** Once a stakeholder picks a direction, the file moves from
  `components/custom/<name>/` to `components/base/` or `components/application/`, its doc page
  moves from "Custom Components" to "Components" (plus a real `design-system.config.ts` entry if it
  needs variants), and every `/pages/*` screen using it is repointed at the new
  import path. If the direction changes instead, the custom component gets replaced, same as any
  other gap would.
- **First instance: `components/custom/date-range/date-range-control.tsx`.** Replaced the
  `GapDateRange` `?`-marker in `app/pages/dashboard/option-1/page.tsx` - a real prev-arrow /
  calendar / range-text / next-arrow control (react-aria `RangeCalendar` + `DialogTrigger`, the
  real DEW `Popover` for the overlay shell), documented at `/custom-components/date-range`.
