# DEW Design System - working context

This file documents how components get added to this site and the
conventions that came out of building the first one (Avatar) end-to-end.
Read it before ingesting a new component or touching the doc-page template.

## Final check - non-negotiable contracts

Before calling any task finished (not just a new component ingest - any change to
`components/base/**`, a doc page, a token, or a `/test-*` screen), re-read the diff against this
list. These are contracts, not preferences - a task that violates one of these is not done, no
matter how complete it otherwise looks.

- **The QA check runs at the end of every component ingest, clean, no exceptions.** See "QA
  check (non-negotiable, post-ingestion)" below for the full checklist (`tsc`, `lint`, utility
  classes actually resolve, portaled content carries its own `font-barlow`, no doc-site global
  leaking into a component's own markup, a live browser pass, a Figma audit if a frame exists,
  a sibling-file grep for the same bug pattern). A component ingest is done when this check
  passes, not before - "it type-checks" is not the bar.
- **Sidebar/config slotting is alphabetical, always.** A new entry in `lib/nav.ts`'s `Components`
  array and a new top-level key in `config/design-system.config.ts` both get inserted in strict
  A-Z order by title/key - never appended at the end because that was faster. If either file is
  ever found out of order (including entries that predate this rule), fix the whole list while
  you're there, not just the new entry - a partially-sorted list is worse than an honestly
  unsorted one, because it looks intentional. (`Primitives` and `Patterns` in `lib/nav.ts` are
  deliberately *not* alphabetical - they follow a foundations-first narrative order - this rule is
  scoped to `Components` only.)
- **The DEW/Scaffold line holds.** No real component under `components/base/**` was patched to
  serve a doc-only or Scaffold-only need. See "DEW vs. Scaffold" below.
- **Figma is the source of truth wherever a frame exists.** No colour, spacing, or state was
  invented or left un-checked against Figma when a reference frame was available. See below.
- **Component-level changes flow through to every `/test-*` page that uses that component, same
  session.** A resolved `?` gap gets its placeholder swapped, its gap table updated, and its
  mapping table updated together. See "Generated screens" below.
- **No em-dashes** in this file or in any doc-page/component copy - hyphens only.
- **No arrow characters standing in for an icon - not `->`, not `→`.** `Button` (`components/base/
  buttons/button.tsx`) takes an `iconTrailing` prop on every color variant, including `link-color` -
  a "go to X" affordance uses `<Button color="link-color" iconTrailing={ArrowNarrowRight}>Go to
  X</Button>`, a real icon, never a character appended to the label text. Caught after the fact:
  every such button across `/pages/*` originally read `{label} →` as plain text - fixed to use
  the icon prop instead, per the user directly.
- **Geist stays Geist, Barlow stays Barlow** - Scaffold text never borrows `font-barlow` to match
  a DEW neighbour, and vice versa, except inside a generated screen where everything is Barlow.
- **No fabricated Figma links, no fabricated icons/assets, no invented props.** An honest "not
  linked yet" / `?` placeholder beats a plausible-looking fake every time.
- **The placeholder person is Olivia Wyatt** (plus Phoenix Baker / Lana Steiner for multi-person
  demos) - never the current user's real name or email.
- **An external reference (Mobbin, a Figma link, a screenshot from another product) is a source of
  UX patterns, never of style.** Our colours, spacing, radius, shadows, and type scale do not
  change to match a reference, and no existing `components/base/**`/`components/application/**`
  component gets replaced or forked to look more like one - the reference's *interaction or IA
  idea* gets rebuilt from our own tokens and components, never its pixels. See "Adopting UX
  patterns from external references" below for the full workflow this runs through.

If a check on this list fails, fix it before reporting the task done - don't note it as a loose
end and move on, unless it's a genuinely separate, larger piece of work (in which case say so
explicitly and log it under "Known gaps" below, the same way the gray-scale primitive audit and
the File Type Icon set were).

## Design principles (cognitive load)

Added after the business flagged another designer's lo-fi Projects detail wireframe as "clumsy"
(https://www.figma.com/design/YMproGZfrFB5jUqPHPxMhk, node 65-20685) - not wrong data, wrong
*shape*: it's a real, thorough reflection of BDBSA's actual project metadata schema (Project
Details, Data Owner/s, Project Manager/s, Location, Data Collection, Permit, URI/DOI, Privacy and
Restrictions, Embargo, Species, Location again, Project Data, Others - ~15 sections), rendered as
one continuous scroll of label/value rows with no tiering, so being research-heavy and correct
still reads as overload. BDBSA's real domain (see "BDBSA domain research" and the Projects data
model - Projects, owned by a person or org, with many datasets each contributed by anyone,
containing a real Site/Visit/Observation/Occurrence record tree) is genuinely dense. These
principles are how we keep that density from becoming clumsiness, going forward - a non-negotiable
design lens, same tier as "Final check" above, not just a Projects-specific note.

- **Progressive disclosure over flat dumps.** A screen with more than ~5-6 field groups needs
  tiering (Tabs for parallel concerns, Accordion for optional/rarely-touched ones), not one
  continuous scroll. The wireframe's own Details/Events/Occurrences/Observations/Additional
  Information tab row is the right instinct already present in it - the failure is everything
  *inside* "Details" still being one flat scroll instead of applying the same tiering one level
  down.
- **A conditional field is conditional in the UI too.** The wireframe renders Embargo/Species/
  Location restriction tables in full even when "Privacy and Restrictions: None" is presumably the
  common case - a wall of empty `-` placeholder rows for a state that doesn't apply. If a section
  only matters when some other field is set a specific way, don't render its scaffold until that's
  true.
- **Group by how it's used, not just by what it is.** High-frequency fields (status, dates, who's
  contributing) and low-frequency ones (a DOI, permit numbers, raw data storage notes) shouldn't
  share the same visual weight just because they're both "project metadata." Put what gets checked
  often first and un-tiered; push the rest behind a tab or accordion, even if that means it's no
  longer alphabetical or schema-order.
- **Repeated table shapes need distinct containers, not just a label.** The wireframe has ~4 near-
  identical Full Name/Organisation/Email/Phone-style tables (Data Owner org contact, Data Owner
  individual contact, Project Manager contact, ...) separated only by a thin rule and a text label -
  easy to lose track of which table you're reading. Give each its own real card boundary (this
  codebase already has `BentoCard` for exactly this), not just adjacent whitespace.
- **Same word, different meaning, needs distance or disambiguation.** The wireframe has two
  sections both called "Location" (data collection location vs. a location-based restriction) -
  harmless in a spec doc, confusing in a UI. Rename one, or make the hierarchy visually obvious
  enough that they can't be mistaken for the same field re-appearing.
- **An empty field is either omitted or clearly marked empty - never a stray `-`.** Same "honest,
  not fabricated" instinct as everywhere else in this file, applied to density specifically: a
  `-` scattered through a dense form reads as more "missing data" than "not applicable," and a
  screen with many of them reads as unfinished even when it's actually just correctly reflecting
  fields that don't apply to this record.

**General working principles** (not Projects-specific - apply to any screen, any persona):

- **Anything findable within 3 clicks.** From the primary nav, a user should reach any specific
  piece of content - a project, a dataset, a single record, a guide - in 3 clicks or fewer. If a
  real path takes more, that's a sign the IA needs a shortcut (search, a "recently viewed" list, a
  direct link from where it's referenced) rather than asking the user to memorize a deeper path.
- **Never show everything on one page.** A screen competing for attention with several full-weight
  sections at once is the same failure mode as the flat-scroll wireframe above, just at the page
  level instead of the field level - split by tiering (tabs, accordions, a "view all" link) rather
  than rendering it all unconditionally.
- **When cognitive load and one extra click are in tension, take the extra click.** Every time. A
  collapsed-by-default disclosure, a second tab, a "show more" - all cheaper than a page the user
  has to visually triage on load. Don't default to "show it all just in case it's needed."
- **One clear focal point per view.** If a user can't say what they should look at first within a
  second of landing, the hierarchy has failed - decorative or "nice to have" content should visibly
  read as secondary, not compete in size/weight with the page's actual primary action. Worked
  example: the registered-user dashboard originally treated Welcome/KPIs/3 quick-action buttons/
  Needs-your-attention/Featured Projects/Knowledge Base as 5-6 co-equal blocks with no visual
  anchor - flagged directly by the user ("what am I looking at first? Adds to the overwhelm").
- **Never restate the same fact in two different treatments on the same screen.** If a task, a
  status, or a piece of metadata is already shown once, don't also surface it as a second, louder
  element elsewhere on the same page - pick the one place it belongs. Worked example: an early pass
  at the dashboard hierarchy fix added a hero "Continue: [task]" banner button that repeated a task
  already listed in "Needs your attention" one section down - same information, two treatments, and
  the banner falsely inflated one of several equally-pending tasks above the others.
- **Check your own output against these before presenting it, not after.** A round of layout
  variants can reproduce the exact overload pattern these principles exist to prevent - count
  same-weight "primary-looking" elements per variant, ask "where does the eye go first," before
  showing a set of options rather than after the user catches it.

**Built, as a worked example: `project-detail/option-1`'s "Projects" main content** (a second,
hi-fi reference confirmed the same ~15-section flat-scroll shape, plus new fields - Overview/
abstract/geographic map, Data Owner/s, Project Manager/s, Locations, Data Collection Scope, Permit,
URI/DOI, Privacy and Restrictions, Additional Details, Comments - "all these would show" on a real
project overview). Restructured into real `Tabs` (`ContentTabs`/`TabList`/`Tab`/`TabPanel`, aliased
from the raw `Tabs` already imported for the Home switcher boundary) - **Overview** (stat tiles for
Events/Occurrences/Observations/Attached Resources, abstract, `MapView`, Data Owner + Project
Manager as matching `ContactCard`s), **Datasets** (new - a real `Table` of contributed datasets,
since contribution is open per the confirmed data model, so this project has more than one
contributor, not a single owner-uploaded list), **Details** (an `Accordion`, collapsed by default,
for the fill-once fields - Data Collection Scope/Locations/Permit/URI-DOI), **Restrictions** (empty
for this project - an honest "No restrictions" state, not 5 empty tables - the general structure is
data-driven so a project that *does* have active restrictions renders one `Accordion` item per
active type, not all 5 unconditionally), and **Additional Information** (custom fields + comments,
both honestly empty for this example). Events/Occurrences/Observations deliberately did *not* get
their own tabs here the way both references had them - that hierarchy is already real and
browsable in this page's own contextual-sidebar `TreeView`, so repeating it as 3 more flat tabs
would show the same records twice, once without the real component. "Short Title"/"Full Project
Name" were dropped as separate fields - the H1 title already is the short title, and "Full Project
Name"'s value was the exact first sentence of the Abstract, word for word, in both references - a
real duplicate, not new information, so keeping both would violate this section's own principles.

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

## DEW vs. Scaffold - the one rule

Every doc page mixes two different kinds of UI, and they must never be confused for each other.

**Mental model: Storybook.** Storybook has its own UI (sidebar, toolbar, the Controls addon
that lets you tweak a story's args) which is entirely Storybook's, styled Storybook's way,
regardless of which design system is being previewed inside the canvas. Storybook's Controls
addon is never assembled from the hosted library's own Button/Input/Checkbox - it's the host's
tooling, not the thing being hosted. In this repo: Scaffold is Storybook. DEW is whatever's
being previewed. A component is DEW only when it's the thing being demonstrated. The moment a
component is being used to operate a demo (a control, a toggle, a trigger button) it is
Scaffold, even if it looks like a form field and even if a real DEW equivalent of that field
exists elsewhere in the library.

- **DEW** - the real, installed product component library, `components/base/**`, pulled in via
  the Untitled UI CLI and styled entirely through the `--ui-*` semantic token layer in
  `app/globals.css`. This is what ships in an actual product, and it only counts as DEW when
  it's the subject being demonstrated. On the Avatar page, the only DEW element is `Avatar`
  itself (plus its own family: `AvatarLabelGroup`, `AvatarProfilePhoto`, `AvatarAddButton`,
  `AvatarCompanyIcon`) rendered live in the Playground's canvas and throughout the Variants
  sections below it.
- **Scaffold** - everything the doc site built for itself that is *not* the component being
  demonstrated, including things that reuse DEW's visual tokens or even resemble real DEW
  components: `PageHeader`, `Section`, `ContextualConfigPanel`, the Playground's canvas/card
  chrome, and every control in `components/scaffold/controls.tsx`
  (`ScaffoldButton`, `ScaffoldTextInput`, `ScaffoldNumberInput`, `ScaffoldCheckbox`,
  `SegmentedControl`, `ScaffoldLabel`). These exist either because a DEW primitive doesn't exist
  yet (no `Select`/`Toggle`, so `SegmentedControl` stands in) or because the doc site needs its
  own tooling that was never meant to ship in a product, even where a shipped DEW equivalent
  exists (the Playground's "Count" stepper is Scaffold, not the real `InputNumber`, even though
  `InputNumber` exists and would render fine there).

The rule, in one direction only:

- **Scaffold may inherit from DEW.** Reach for the same `--ui-*`-backed utility classes
  (`bg-primary`, `text-secondary`, `border-secondary`, `shadow-xs`, …) instead of inventing a
  parallel palette or falling back to raw inline `var(--color-*)` primitives. This is why
  `SegmentedControl` and the Playground chrome were rebuilt to use those classes - same token
  vocabulary as the real components sitting next to them.
- **Scaffold's design *style* stays independent of DEW's.** A `SegmentedControl` pill doesn't
  need to look like it belongs to any real product component - it only needs to be built from
  the same token vocabulary as one. Sharing tokens ≠ sharing visual identity.
- **DEW must never overlap with Scaffold, in the other direction, ever.** Never patch a real
  component under `components/base/**` to satisfy a doc-page-only need. If the Playground needs
  behaviour a real component doesn't have, that need gets solved in Scaffold code (the page
  itself, or a doc-chrome helper in `components/`) - never by adding doc-specific props,
  classNames, or variants to `Avatar`, `Checkbox`, etc.
- **Never build a Scaffold control from a real DEW component import, even when a matching one
  exists.** This was gotten wrong once: the Playground's Size/Initials/Status/Count/Border/
  Verified controls were originally built from the real `Checkbox`/`Input`/`InputNumber`, on
  the reasoning that reusing real components was good dogfooding. Per the Storybook model
  above, that was backwards, those controls operate a demo, they are not the demo, so they were
  rebuilt as `ScaffoldTextInput`/`ScaffoldNumberInput`/`ScaffoldCheckbox`. Likewise
  `ContextualConfigPanel`'s trigger button and its show/hide checkboxes were rebuilt from
  `ScaffoldButton`/`ScaffoldCheckbox`, not the real DEW `Button`/`Checkbox`.
- **The DEW/Scaffold line should always be answerable by one check: role, not import path.**
  Is this element the thing being demonstrated, or is it operating/wrapping the demonstration?
  The first is DEW, the second is Scaffold, regardless of whether a DEW component of the same
  shape exists. If that's ever ambiguous for a given element, that's a bug in how the page was
  built, not a grey area.
- **Scaffold labels are Geist. DEW components are Barlow. Full stop, no exceptions.** Because
  Scaffold controls in the Playground no longer import real DEW components (see above), the
  whole Playground reads in Geist end to end, canvas caption and controls alike, and the only
  Barlow on the page is the live `Avatar`/`AvatarLabelGroup`/`AvatarProfilePhoto`/
  `AvatarAddButton` instances rendered in the canvas and the Variants sections below. Their
  Scaffold `Section` labels (e.g. "ADD BUTTON") stay Geist right next to them. Never add
  `font-barlow` to a Scaffold label to match a DEW neighbour, never strip `font-barlow` from a
  real DEW component to match a Scaffold neighbour. Token colours are shared (Scaffold may
  inherit DEW's `--ui-*` palette, see above); typefaces are not. (Verified live:
  `getComputedStyle` on a `Section` label returns `Geist, ui-sans-serif, ...`; the DEW form
  components under `components/base/**`, e.g. `Input`, still bake in
  `Barlow, "Barlow Fallback", ...` wherever they're actually used to demonstrate themselves.)

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
6. **A live browser render, not just a code read.** Start the dev server, open the doc page (or
   every `/pages/*`/`/test-*` screen using the component), and actually interact with every
   documented state - open the modal, expand the dropdown, toggle the selection, sort the
   column - via a real headless-browser pass (Playwright), checking for zero console/page errors
   and confirming computed styles (`getComputedStyle`, not assumed from the className) match
   intent. A component can look correct from the source and still be broken at runtime - most
   items above (the dead utility classes, the font-barlow gaps, the prose leak) were only ever
   caught this way, never by reading the JSX.
7. **If a Figma frame exists, the shipped styling is audited against it directly, on this
   pass - not deferred.** See "Figma is the source of truth" above; this QA check is one of the
   points in the workflow where that audit is expected to happen, not an optional follow-up.
8. **If a bug is found, grep sibling/dependent files for the same pattern before calling it
   fixed.** A bug caught in one file is often shipped in more than one - `selected:bg-secondary`
   was wrong in both `components/base/table/table.tsx` and `components/application/table/
   table.tsx`; the `font-barlow` gap above was never a single-file fix. Fixing the one instance
   a screenshot happened to catch and stopping there is not passing this check.
9. **Any genuinely separate, larger issue this pass surfaces gets logged under "Known gaps"
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
    are single fields within it and got the `?` marker as normal (Radio has since been resolved -
    see the flow-through rule below; Textarea is still open).
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

## Exploratory page layouts (`/pages/<page-name>`, `/pages/<page-name>/<variant>`)

A `/pages/<page-name>` route is a different thing again from both a doc page and a `/test-*`
generated screen. `/test-*` exists to prove one specific, already-decided Figma frame maps 1:1
onto the shipped component library - a fixed target. `/pages/*` exists for the opposite
situation: exploring what a real product screen (a dashboard, a shell) could look like while the
surrounding information architecture - navigation, sidebar contents, breadcrumbs - is still being
decided. Same rigor, different scope of what's "locked."

`/pages/<page-name>/<variant>` (e.g. `/pages/dashboard/option-1`, `/pages/dashboard/option-2`)
is the same kind of thing, one level further out: multiple competing layout explorations of the
*same* screen, sitting side by side while the screen's own purpose/IA is still being decided, not
just its chrome. Every rule below applies equally to both - the only difference is a bare
`/pages/<page-name>` is one committed direction, `/pages/<page-name>/<variant>` is several
not-yet-chosen ones.

- **Every contained widget still has to be real DEW, or honestly `?`-flagged - no exceptions
  carried over from `/test-*`.** A search field, a button, an avatar, a date picker: if it's an
  actual interactive control, it goes through the same "no match, no substitute, no silent drop"
  rule as a `/test-*` screen (see "Generated screens" above) - real `components/base/**`/
  `components/application/**`/`components/foundations/**` component with its exact API, or a
  visible `?` gap marker inline in the screen (see `GapDateRange` in
  `/pages/dashboard/option-1`), never a lookalike.
- **Navigation/IA chrome is explicitly exempt from that fidelity, because it isn't decided yet.**
  A primary icon rail, a contextual sidebar's nav list, a breadcrumb - anything whose job is "get
  the user somewhere else in the product" - gets built as a simplified structural placeholder from
  real tokens (borders, backgrounds, spacing - same "Scaffold may inherit from DEW's token
  vocabulary" rule as everywhere else), not pixel-matched to the Figma frame's specific icons/
  spacing and not `?`-blocked either. The point of a `/pages/*` screen is to see the content it's
  shaped around, not to lock in a nav pattern nobody has agreed on. Once `/patterns/navigation`
  (or a sibling) has a real, decided pattern, `/pages/*` screens should adopt it - until then, a
  placeholder is honest, a pixel-perfect guess isn't.
- **None of `/test-*`'s review apparatus - no `InspectorProvider`/`Inspectable` hover trace, no
  component-mapping table, no gap section.** That apparatus is for proving a fixed, already-decided
  Figma frame maps 1:1 onto the shipped component library - it belongs to `/test-*` only. `/pages/*`
  is reserved strictly for building product page layouts: it should look and feel like the real
  screen it's previewing, not a doc/review surface. Follow
  `app/pages/dashboard/option-1/page.tsx` as the template for a new `/pages/<page-name>` or
  `/pages/<page-name>/<variant>` screen, not `app/test-site-details/page.tsx`.
- **Icon-rail sections that have their own real page navigate there for real; sections that don't
  keep the local, in-place switch.** `dashboard/option-1`, `project-list/option-1`, and
  `project-detail/option-1` are three sibling shells sharing one icon rail + contextual sidebar
  layout, and originally every rail click - Home, Projects, Observations, DLA, ... - just swapped
  local `activeSection` state, rendering that section's content in place without changing the URL.
  That's honest for sections with no real page (still a `SectionPlaceholder`), but Home and
  Projects *do* each have a real page (`dashboard/option-1`, `project-list/option-1`), so faking
  their content in place left the URL, back/forward, and refresh all lying about what's on screen -
  flagged directly by the user off 3 screenshots of `project-list/option-1`: clicking Home showed
  Home's content but the URL still read `project-list/option-1`, and going back from there kept
  showing the same stale URL. Each shell's `goToSection(section)` now checks whether the clicked
  section's nav key differs from this page's own `CURRENT_KEY`: if so it `router.push`es to that
  section's real `/pages/<key>/option-1` route; if not (already on the right page, or the section
  has no real page at all) it falls back to the original `setActiveSection` local switch.
  `project-detail/option-1` has no `CURRENT_KEY` of its own (it's reached by drilling into one
  specific project, not a generic destination), so there both Home and Projects always navigate -
  "Projects" from a project's detail page means the real projects list, not re-showing this same
  project's own detail in place.
- **Projects is a leaf with its own key, same shape as Home - not a group with one combined
  "Manage Project and Datasets" child.** `lib/registered-user-nav.ts`'s `Projects` entry used to be
  `{ label: "Projects", items: [{ label: "Manage Project and Datasets", key: "project-list" }] }` -
  one destination blending two distinct resources into a single label. Flagged directly by the user
  off `project-list/option-1`'s own contextual sidebar: they wanted Projects and Datasets as two
  peer tabs there, "like the one we have on the homepage" (Home's My BioData/Flora and Fauna
  Dashboard `button-brand` `TabList`). Changed to `{ label: "Projects", key: "project-list" }` and
  gave `dashboard/option-1` and `project-list/option-1` their own "Projects" `Tabs` boundary
  (mounted only while that section is active, mirroring Home's own block exactly) with two tabs -
  Projects (`Folder` icon, renders the real `ProjectListContent`) and Datasets (`Database01` icon,
  still the honest "hasn't been scoped yet" placeholder - no reference content for it yet). Once
  Projects became a keyless-child-free leaf, `dashboard/option-1`'s `NavTree` lost the
  `isCurrent` special-case it grew for Bug A (highlighting "Manage Project and Datasets" from
  outside `project-list/option-1`) - that case is unreachable now since Projects never reaches
  `NavTree` at all, it gets its own `Tabs` branch same as Home. `project-detail/option-1` was
  deliberately left out of this change - its "Projects" section already shows one specific
  project's own detail (metadata, abstract, nested-records `TreeView`), not a Projects/Datasets
  resource picker, so forcing the same two-tab split there would misrepresent what's actually on
  screen. A first attempt put this split one level down instead - as a 5th "Datasets" sub-tab
  inside the Flora and Fauna Dashboard's own Overview/Flora/Fauna/Projects tabs - reverted once the
  user clarified the split belonged in the icon rail's contextual sidebar, not inside that
  dashboard's own content.
- **`public-user` ("Guest User") is built across all three option-1 shells - see "User roles"
  above for the real nav tree this reads.** Each shell (`dashboard/option-1`, `project-list/
  option-1`, `project-detail/option-1`) reads `useUserRole()` and picks `publicUserNav` over
  `registeredUserNav` for every nav-driven part (icon rail, `MobileNavTrigger`, `activeSectionNode`
  lookups) - a separate tree, not a filtered view, since whole sections disappear for this role,
  not just leaves inside them (see `lib/registered-user-nav.ts`'s `publicUserNav`).
  - **Home and Projects skip the two-peer-tab `Tabs` boundary entirely for this role** (checked
    before the `registered-user` two-tab branches, so those never run) - guest's Home/Projects are
    each a single view, and a two-tab switcher with only one real tab would be dishonest UI, not
    just a visual downgrade. Renders `DataOverviewContent`/`ProjectListContent` directly instead.
  - **No contextual-sidebar `<aside>` at all for those two single-view sections** - not the usual
    aside with just a section-label heading and nothing else in it. That shape depends on the aside
    holding real selectable content (a `NavTree`, a `Tabs` switcher); with neither, it's a 286px
    empty box with the footer links stranded at the bottom - flagged directly by the user as
    looking empty/unfinished after the first pass kept the (now-pointless) aside. Icon rail + full-
    width main content instead - a deliberately leaner layout matching "guest is a bare bones
    version of the platform," not a broken one. The footer links this aside would have carried are
    still reachable from Observations' own aside (the one section left that still uses it) - not
    worth inventing a new place to repeat them everywhere.
  - **Header**: `ProfileMenu` (avatar + Profile Settings/Logout) is replaced by `GuestAuthActions`
    (disabled "Log in"/"Sign up" buttons + a "coming soon" tooltip - there's no real auth flow
    anywhere in this build, same honesty convention as `DisabledQuickAction`). "Add project"/
    "Upload dataset" are hidden outright (not disabled) for this role - the gap isn't that they're
    unbuilt, it's that a signed-out guest was never meant to see them.
  - **`dashboardTasks.length`'s badge on the Home icon never shows for this role** - that list is a
    signed-in user's own pending tasks, and guest's Home has no personal content to badge.
  - **`project-detail/option-1` needed the least change** - its "Projects" section already shows
    one specific project's own detail (metadata, `TreeView`), a single view for every role already,
    not the two-peer-tab pattern the other two shells have to branch around. Only the icon rail
    data source, header, and badge needed the same treatment as the other two shells.
  - **Not filtered**: `ProjectListContent` renders the identical table for both roles - "View Level
    1 Public Project Data" implies a real public/private data split we don't have, and fabricating
    a filtered subset with no real leveled data behind it would be inventing content. See the
    "Backlog" section's record-level filtering entry.
- **A Figma frame's own internal annotations (a sticky note, a designer's comment layer) are not
  product UI and don't get reproduced.** If a layer is clearly a note-to-self about the design
  rather than something meant to render in the product (check for a comment-style visual
  treatment - a highlighter-yellow card, a "NOTES" label - distinct from the rest of the frame's
  real UI), leave it out of the screen and say so in the page's own notes/mapping section, the
  same way a plain non-interactive text layer just becomes text rather than a fabricated
  component.
- **Not added to `lib/nav.ts`.** Same precedent as `/test-*` - these are working screens, not
  documented product surfaces, reached by direct URL.
- **Renders full-screen, with none of the doc site's own chrome.** A `/pages/<page-name>` or
  `/pages/<page-name>/<variant>` screen is a preview of what a real product UI shell would look
  like, not a documentation page, so the doc site's Sidebar and its `ml-56 max-w-5xl` content
  column must not wrap it. This is enforced structurally, not by convention: every documented,
  chrome-having route (home, `/primitives/**`, `/components/**`, `/patterns/**`, `/config`,
  `/test-*`, `/llms.txt`) lives inside the `app/(docs)/` route group, whose `app/(docs)/layout.tsx`
  renders `Sidebar` plus the constrained `main`. `app/pages/**` sits outside
  that group entirely, so the root `app/layout.tsx` (fonts, `ConfigProvider`, `Toaster`, dev-only
  `Agentation` - genuinely global concerns only) is the only layout wrapping them. A new screen
  should own its own full-height root (`min-h-screen`) exactly like
  `app/pages/dashboard/option-1/page.tsx` does - it needs to look like a real screen, not a doc
  page with the sidebar subtracted.
- **`project-detail/option-1`'s header/Overview layout and contextual sidebar were redesigned via
  two `prototype`-skill labs, `/proto/project-header` and `/proto/project-sidebar` (kept in place
  after integration, not deleted - per the user, exploration routes stay as evidence of the
  directions considered, not just the one that shipped)** - decided after several rounds of user
  feedback that the original layout (a
  plain meta row + a flat, fully-expanded `TreeView`) risked cognitive overload at scale: project
  metadata that required a scroll to see, and a records tree that would not survive a project with
  thousands of observations. Two separate decisions:
  - **Header/Overview: "Meta Under Title, Full Rail."** The meta row (Project ID/Start Date/End
    Date/Status/Published by) stays exactly where it always was, directly under the title, and is
    deliberately *repeated* in a persistent right rail (`ProjectDetailsCard`) alongside Data Owner/
    Project Manager (`ContactCard` x2) - accepted duplication, on the theory that a fact worth
    showing once is worth being scannable without scrolling back to the header while reading
    Overview/the map. `project` (id/startDate/endDate/status/publishedBy) is one shared object so
    the meta row and the rail's copy of it can't drift apart. Rejected: "Full-Width Stats" (meta
    row moved into the rail only, no under-title copy - lost the always-visible metadata the user
    had asked to bring up in the first place); "Meta Under Title, Clean Rail" (no duplication - rail
    holds only Team Roles, not Project Details); "Status Up" (only the Status badge promoted next
    to the title - too little promoted given the original complaint was "metadata needs a scroll");
    "No Rail, Card Grid" (meta under title, but no persistent rail - Overview/Team Roles/Project
    Details flow as an equal-weight card grid instead); "Collapsible Properties" (a Linear-style
    one-line summary under the title with full fields collapsed behind a disclosure - rejected
    because it *hides* the metadata rather than surfacing it).
  - **Contextual sidebar: "Grouped by Type + Search."** The nested-records `TreeView` used to dump
    every child (Observations/Occurrences/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom Event) as
    flat siblings under the one Site node - fine for one demo site, would not scale. Fixed by
    grouping a node's own children by type only where they're a genuine mix (checked against the
    Figma wireframe's per-record-type Details Containers,
    `YMproGZfrFB5jUqPHPxMhk` node `1970-162922` - a Site really does hold Visits/Transects/Quadrats
    side by side, so grouping had to happen *inside* that real hierarchy, not by flattening it into
    type-only buckets and losing which site/visit a record came from), each bucket capped at 8
    visible rows with an honest "+N more - search to narrow" instead of rendering all of them, plus
    a search box (its placeholder lists every real record type, generated from the same type list
    the grouping logic uses so the two can't drift) that filters the whole tree and auto-expands
    only the branches/buckets that actually contain a match. See `groupByType`/`filterRecordTree`/
    `collectGroupedContainerIds`/`renderGroupedNode` in `app/pages/project-detail/option-1/page.tsx`
    for the implementation. Rejected: the original flat dump (Baseline); a first "Grouped by Type"
    pass that flattened by type globally and lost containment entirely (the specific gap the user
    flagged after the Figma reference); "Search-First" alone (full hierarchy, collapsed until
    searched - superseded once search was merged into the grouped version rather than standing on
    its own); "Breadcrumb Drill-Down" (one level visible at a time, no persistent tree shape); "Flat
    Virtualized" (drops the folder/site metaphor for one flat record list with type filter chips -
    the strongest pure-scale answer, but loses the containment story entirely).

## Adopting UX patterns from external references (Mobbin, Figma, screenshots)

A screenshot or Figma link from another product (Supabase, the SA Flora and Fauna dashboard,
anything pulled via Mobbin) is a source of *interaction and information-architecture ideas* for
`/pages/*` screens, never a source of colour, spacing, radius, or component choice. Two
non-negotiable contracts govern every reference like this - see "Final check" above:

- **Our styles do not change.** Every colour, spacing value, radius, shadow, and type scale stays
  exactly what this design system's tokens already say. A reference's white sidebar, its specific
  badge colour, its font - none of it is copied. If a pattern implies a visual choice (e.g.
  "highlight the active item"), that highlight is built from our own tokens (`bg-primary` against
  `bg-secondary`, our own `Badge` colours), not the reference's.
- **Our components do not get replaced.** A pattern gets built from `components/base/**`/
  `components/application/**` exactly as they exist today - `Tabs`, `Table`, `ComboBox`,
  `ToggleButtonGroup`, `Badge`, whatever already fits - never a new one-off widget copied from the
  reference's own markup, and never a swap of an existing DEW component for something closer to
  the reference's look.

The workflow, in order - each step is a checkpoint, not a formality:

1. **Ingest** - a screenshot or a Figma link (Figma MCP's `get_screenshot`/`get_design_context`, or
   a Mobbin MCP search for "how does app X do this"). Actually look at the image; don't infer a
   layout from metadata or a node name alone.
2. **Extract patterns, not pixels.** Name the *interaction or IA idea* behind each notable piece of
   the reference (progressive disclosure via a collapsed accordion, a persistent toolbar above a
   data table, an explicit end-of-list indicator, a breadcrumb segment that's also a switcher) -
   not "this sidebar is white" or "this uses a 12px radius." A pattern survives translation into
   our own tokens; a style doesn't need to.
3. **Propose a list of changes. Don't write code in this step.** Present the candidate patterns,
   which of our existing pages/components each one would apply to, and why - then stop and let the
   user pick which ones (if any) to pursue. This step is research and a proposal, not an
   implementation - the same "don't implement until the user agrees" boundary as any other
   exploratory/direction-setting ask.
4. **Map to our system.** For each pattern the user picks, name the exact existing DEW
   component(s) and token(s) it will be built from before writing any code. If no existing
   component fits honestly, say so rather than inventing one silently - same "no match, no
   substitute" rule as everywhere else in this file.
5. **QA.** Once built, the same "QA check (non-negotiable, post-ingestion)" checklist above
   applies - `tsc`, `lint`, a live render check, a grep for the same pattern needing the same fix
   on any sibling file it also appears on.
6. **Document the pattern here**, so the next time a similar reference comes up the pattern is
   already named instead of needing re-deriving from scratch - see the catalog below.

### Pattern catalog

**Source: Supabase "Logs" page**, pulled via Figma
(`https://www.figma.com/design/bgksKvmSaVR7ZptB98LzGr`, node `80:2292`), compared against
`/pages/dashboard/option-1`'s three-column shell. Patterns extracted (not all adopted yet - see
the task this was logged under for which ones the user picked):

- **Persistent toolbar above a data table** - a filter input plus utility actions (refresh,
  export) sitting directly above the table, always visible, rather than a page that opens straight
  into rows. Candidate for `ProjectListContent` (`app/pages/_shared/project-list-content.tsx`,
  built on `components/base/table/table.tsx`), which today opens straight into the table with no
  toolbar row.
- **Explicit end-of-list indicator** - a plain-text line below the last row stating the list is
  exhausted ("no more data to load"), so a paginated/infinite table never leaves the user unsure
  whether more exists. Candidate for the same `ProjectListContent` table once it has enough rows
  to paginate.
- **Every breadcrumb segment with real siblings is its own switcher**, not just the current one -
  we already do this once (`ProjectSwitcher` on the "Projects" crumb in
  `app/pages/project-detail/option-1/page.tsx`, built on `DialogTrigger`+`Popover`+`ComboBox`-style
  search); the pattern is worth applying consistently to any future breadcrumb segment that has
  real siblings to jump between, using that exact same component combination.
- **Progressive-disclosure accordion for a long facet list** - one filter group open by default,
  the rest collapsed, so a long list of facets doesn't compete for attention at once. Not urgent
  today (our sidebars are short nav lists, not filter panels) but the right pattern once a page
  needs more filters than a `ToggleButtonGroup` row can hold - see `GlobalProjectSearch`
  (`app/pages/_shared/global-search.tsx`) for the simpler chip-row version we use today.
- **A contextual promo card for a secondary, not-yet-critical capability**, placed where the user
  is already working rather than as a global banner. We already have a lighter version of this
  idea (`DisabledQuickAction` in `app/pages/_shared/home-dashboard.tsx` - a disabled button with a
  tooltip explaining "coming soon"); a card would be a heavier version of the same honesty
  convention, not a new one.

## Backlog: explorations held off for now

Ideas that got a real look - not just mentioned in passing - and were deliberately set aside rather
than built, so the reasoning survives instead of getting re-litigated from scratch (or silently
re-proposed) next time something similar comes up. Different from the "Pattern catalog" above:
those are patterns not yet *picked*; these are ones that were considered and actively turned down
for now, with a stated reason and a condition for revisiting. Move an entry here into real work the
moment its "revisit if" condition actually happens - it stops being backlog at that point.

- **Record-level "Level 1 Public" data filtering.** Guest's Projects/Observations are meant to show
  the *same* underlying data as `registered-user`, scoped down to a public subset - every gate built
  so far (`orgSwitcher`, `metricCardCustomization`) hides a whole control, not a subset of rows.
  `ProjectListContent` currently renders identically for both roles (see "Exploratory page layouts"
  below) rather than fabricating a filtered subset with no real leveled data behind it. **Revisit
  if**: real per-record "Level 1 vs Level 2" data (or even a plausible mock of it) becomes
  available to filter against.
- **Column-1 "expand on hover" sidebar (Supabase's "Sidebar control": Expanded/Collapsed/Expand on
  hover).** Considered after the user pointed out Supabase's hover-to-reveal nav as something that
  "was really good." Held off because the two layouts don't actually match: Supabase collapses
  *one* nav column down to icons and reveals labels on hover; our option-1 shells already have
  *two* columns - an icon-only rail plus a persistent 286px contextual sidebar that holds real
  stateful controls (`NavTree` expand/collapse, the Home and Projects `Tabs` switchers), not just
  links. Hover-triggered reveal fits low-stakes link lists; it's a poor fit for a panel whose
  content could disappear mid-interaction if the pointer drifts off it. It also has no
  keyboard/touch equivalent without extra work, and the space-reclaiming problem it solves for
  Supabase is one we already solve differently (`MobileNavTrigger`'s modal below `lg`). **Revisit
  if**: someone concretely needs more width for main content (a dense table, the map) often enough
  that it's worth a real toggle - and if so, build column 2 as explicitly collapsible (a click, not
  a hover), closer to Supabase's "Collapsed" mode than its "Expand on hover" one.

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

## BDBSA domain research

The `/pages/<page-name>/<variant>` explorations aren't built from invented content where the real thing is publicly
documented - the Biological Databases of South Australia (BDBSA) is a real DEW program with its own
published fact sheets, and every screen modelling it should stay consistent with what those actually
say. Captured here so the next screen/decision starts from the same grounding instead of re-deriving
or drifting from it. Sources:
[BDBSA overview](https://www.environment.sa.gov.au/topics/science/information-and-data/biological-databases-of-south-australia),
[BDBSA overview fact sheet (PDF)](https://data.environment.sa.gov.au/Content/Publications/bdbsa-overview-fact.pdf),
[BDBSA SuperTables overview (PDF)](https://data.environment.sa.gov.au/Content/Publications/bdbsa-supertable-overview-fact.pdf).

- **What it is.** BDBSA is DEW's centralised repository for South Australian flora/fauna specimen
  and observation records and taxonomic systems - it supports environmental management, research,
  and conservation planning by making biodiversity data accessible.
- **Data hierarchy: Project → Site → Observation → Occurrence.** Projects are the mandatory
  top-level container - **"all data entered into the BDBSA must be assigned to a project
  number."** This directly confirms the "Project as container" reframing from the other designer's
  Projects Figma (see `app/pages/project-detail/option-1`'s comment) and the nested-records tree
  already built there (Site/Observation/Occurrence/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom
  Event) - not an invented shape.
- **"If data does not belong with an existing BDBSA project, you can register a new project"** -
  by completing an online project registration form, or emailing DEWBioDataSupport@sa.gov.au. This
  is a real, sourced requirement for the "create a project inline while uploading a dataset that
  doesn't have one yet" flow discussed earlier (see the HoneyBook/Fabric Mobbin research) - it's not
  a hypothetical nicety, registered users will actually hit this constantly.
- **Real partner organisations named in BDBSA's own material: BirdLife Australia, Birds SA
  (SAOA), and the South Australian Museum.** `Birds SA` was already used as an example org in
  `project-list`'s sample rows - confirmed real, not a placeholder guess. `BirdLife Australia` and
  `South Australian Museum` are two more real names to reach for instead of inventing fresh ones in
  future example content.
- **Access tiers and sensitive data, at the project level.** BDBSA runs an open-access policy by
  default, but **"when a whole dataset is considered sensitive it will be flagged at the project
  level and only distributed under license or with appropriate approval"** - sensitive species'
  precise locations are withheld from general access even when the rest of a project's data is
  public. This is exactly the Level 1 (public) / Level 2 (DLA-licensed) split already named in
  `lib/registered-user-nav.ts`'s Observations/Projects items, and it's a project-level flag, not a
  per-record toggle - worth keeping in mind if/when that gets real UI.

## Registered User dashboard scope

The dashboard's actual job for a `registered-user`, given directly by the user rather than inferred:
it's a personal request/activity tracker, not a chart-heavy BI surface (see the earlier "for-you
page vs. reporting surface" framing this confirms). A registered user needs to see, at minimum:

- **Their DLA (Data Licensing Agreement) requests** - status of anything they've requested access
  under (`lib/registered-user-nav.ts`'s "Data Licencing Agreement (DLA)" section already has
  "Request New DLA"/"Manage DLA" as the two real operations this view would surface).
- **Their sensitive species nominations** - status of anything nominated via "Nominate Sensitive
  Species".
- **Datasets they've uploaded** - their own contributions to the BioData SA portal.
- **Projects they've created**, plus the ability to add more data to an existing one - the
  project-as-container model above means "add data to a project" is the core recurring action, not
  a one-off.

Not yet built - this is scope, not an implementation. The existing dashboard body
(`app/pages/dashboard/option-1`, `option-2`) still has the placeholder KPI/metric-card/map
content from before this was scoped; it should eventually be replaced with real widgets for the
four items above rather than generic biodiversity stats, once that redesign is actually done.

## User roles

The BioData SA portal has six tiers - the slugs below are the source of truth
(`lib/user-role.ts`'s `USER_ROLES`, ordered highest to lowest privilege - that array order *is*
the hierarchy), established while scoping the dashboard exploration (see
`app/pages/dashboard/option-1`, `option-2`). **The type stays the full six - don't shrink it.**
Separately, **active build focus is narrower: just `registered-user` and `public-user` right
now.** Those are two different things - the role model is complete and correct as documented
below; which roles get *built for* today is a scoping call layered on top of it, not a property of
the type. Don't build features for the other four roles ahead of being told to, but don't remove
them from `USER_ROLES` either.

**The hierarchy, highest to lowest:**
`biodata-admin` > `biodata-user` > `privileged-admin` > `privileged-user` > `registered-user` >
`public-user`.

**Key insight: `biodata-admin`/`biodata-user` are themselves an organisation - DEW.** DEW isn't a
neutral platform operator sitting outside the org model, it's the org at the top of it. That's why
org-affiliated chrome (the breadcrumb's org switcher) applies to the `biodata-*` roles too, not
just the `privileged-*` ones - see the role-access matrix below.

- **`public-user`.** Not signed in - shared as "Guest User" off a real IA screenshot, so this is
  now the decided nav tree, not a placeholder to keep gating down speculatively:
  - **Header**: no `ProfileMenu` - a "Login / Sign up" control instead, since there's no account to
    show an avatar/settings/logout for.
  - **Home**: one destination, "BioData Dashboard" - not `registered-user`'s two-peer-tab split
    (My BioData / Flora and Fauna Dashboard). A signed-out guest has no personal contributions to
    show a "My BioData" tab for, so Home *is* the org-wide Flora and Fauna Dashboard directly (the
    existing Overview/Flora/Fauna/Projects tabs), no switcher wrapping it.
  - **Projects**: one destination, "View Level 1 Public Project Data" - not the Projects/Datasets
    two-peer-tab split either, and scoped to Level 1 (public) records only, not the full project
    table `registered-user` sees today.
  - **Observations**: one destination, "View Level 1 Public Observation Data" - `registered-user`
    has this plus a second, DLA-gated "Level 2" item; guest only ever sees Level 1.
  - No Data Licencing Agreement, Nominate Sensitive Species, Reports, or Template Finder sections
    at all - not just hidden leaves under those sections, the whole top-level section disappears.
  - **Footer**: same three links as `registered-user` (Terms and Conditions, Privacy Policy, Help
    and Documentation).
  
  Not yet built - `lib/registered-user-nav.ts` is a single hardcoded tree with no role branching,
  and the Home/Projects two-peer-tab pattern built this session assumes exactly two views per
  section, which breaks for a role where those sections only have one. See the "Backlog"
  section below for the stress-test findings from comparing this tree against the current layout.
- **`registered-user`.** Signed in, an individual account not affiliated with any organisation.
  Can contribute data, nominate sensitive species, track their own submissions/licensing. This is
  `DEFAULT_USER_ROLE` - `/pages/dashboard/option-1` and `option-2` render as this role by
  default, and it's the other tier in active build focus. No organisation - no org switcher.
- **`privileged-user`.** Signed in and affiliated with a partner organisation (a research body, a
  consultancy, a partner like Birds SA - see the "Our partners and data contributors" list on the
  BDBSA page). Gets everything a `registered-user` gets, plus the org switcher. Not in active
  build focus.
- **`privileged-admin`.** Admin of a partner organisation - manages that org's own users/settings
  on top of what a `privileged-user` gets. Not in active build focus.
- **`biodata-user`.** DEW staff. Affiliated with DEW itself (see the key insight above), so also
  gets the org switcher. Not in active build focus.
- **`biodata-admin`.** DEW super-user - the top of the hierarchy, admins the whole platform.
  Always passes every feature-access check (see `hasFeatureAccess`'s bypass) - the "everything
  visible" baseline every feature is built against before gating down for other roles. Not in
  active build focus.

**Switched via the `userRole` URL search param, not a fixed value.** e.g.
`/pages/dashboard/option-1?userRole=privileged-user`. No real auth/session in this exploratory
build, so the URL is the only source of truth for "who's looking at this" - see `lib/user-role.ts`
(the role list + `isUserRole` guard + `DEFAULT_USER_ROLE`) and `lib/use-user-role.ts` (the
`useUserRole()` hook, reads/validates the search param, falls back to `DEFAULT_USER_ROLE` =
`"registered-user"` if missing or unrecognised). A page reading it must render the role-dependent
part inside a `<Suspense>` boundary - `useSearchParams` opts a route out of static rendering
otherwise (Next.js build error) - see the `DashboardPage`/`Dashboard` split in
`app/pages/dashboard/option-1/page.tsx` for the pattern.

**`RoleSwitcher` (`app/pages/_shared/role-switcher.tsx`)** is a dev tool, not a BioData SA feature -
rewrites the current URL's `userRole` param, so previewing a role no longer means hand-editing the
address bar. Flagged directly by the user as "flimsy" after doing exactly that repeatedly to check
the public-user work. Went through two revisions before landing:
1. An always-visible label+`Select` pill, bottom-left.
2. A FAB (the user asked for it "tastefully" collapsed) - `bg-primary-solid` (near-black, not
   `bg-brand-solid` - the one high-emphasis fill in this codebase that isn't the DEW brand colour,
   so it doesn't read as a real branded action button someone could mistake for part of BioData SA)
   circular icon button, bottom-right, opening a `DialogTrigger`+`Popover` containing a `Select`.
3. **Current**: same FAB, but built on `Dropdown` (`components/base/dropdown/dropdown.tsx`, react-
   aria's `MenuTrigger`) instead of `Select` - a `Select` still needed a second click to open its
   own listbox on top of the popover that had just opened. `Dropdown.Root` accepts any trigger, not
   just its own `DotsButton` convenience wrapper, so the FAB button itself is the trigger and every
   role sits directly in the menu that opens under it - one click to open, one to pick, which was
   the entire point of collapsing this into a FAB. Same `selectionMode="single"`/`selectedKeys`
   pattern as the Overview tab's three-dot metric menu (`data-overview.tsx`).

Wired into all three option-1 shells that currently read the role (`dashboard/option-1`,
`project-list/option-1`, `project-detail/option-1`) - not `option-2`, since neither its dashboard
nor project-list reads `useUserRole()`/the role-access matrix yet.

**`useRoleHref` (`lib/use-role-href.ts`)** - every internal `/pages/**` navigation (a `Link`/`Row`
`href`, a `router.push` target) needs to carry the active `userRole` forward, or the destination
page silently falls back to `DEFAULT_USER_ROLE`. This was a real, systemic dead end across every
shell: `goToSection` in all three option-1 pages, `ProjectListContent`'s table row links,
`ProjectSwitcher`'s project links and "View all projects", the "Back to projects" link, Home's
"Manage projects & datasets" quick action and `TaskItem`'s "Continue" action, and
`GlobalProjectSearch`'s result navigation all built a bare path with no query string. Caught after
the user hit it directly: switching Home -> Projects as `public-user` landed back on
`registered-user`'s view. `useRoleHref()` returns `(path) => `${path}?userRole=${role}`` reading the
active role via `useUserRole()` - every one of those call sites now wraps its target through it
before navigating. Verified live (not just by code review): curl'd `project-list/option-1` and
`project-detail/option-1` as `public-user` and confirmed the rendered `href`s carry
`?userRole=public-user`, not a bare path.

**Two more instances missed on the first pass, caught when the user reported the breadcrumb
"misbehaving" for every role, not just `public-user`**: `Breadcrumb`'s own "Home" crumb
(`components/scaffold/breadcrumb.tsx`'s `HOME_HREF`) and `SectionPlaceholder`'s "Go to
{relatedLink.label}" button, in all three option-1 shells. Both are on-screen on every non-Home
page for every role, so both were live, reachable dead ends, not edge cases - `Breadcrumb`
especially, since it isn't one of the 3 page shells and so wasn't in scope for the first sweep's
file-by-file pass. Fixed the same way, verified live across all 6 roles x the 2 non-`dashboard`
shells (12 combinations) via curl - confirmed every rendered "Home" crumb `href` carries the
role it was loaded with, not a bare path. `dashboard/option-2` still has one known, deliberately
unfixed instance (`QuickAction`'s "Manage projects & datasets") - it doesn't read
`useUserRole()`/the role-access matrix at all yet, so it's out of scope, not missed.

### Role access matrix (`config/role-access.config.ts`)

Per-feature visibility is decided in one place - `config/role-access.config.ts` - not by checking
`useUserRole()` inline at each gated element. It's a deliberately separate file from
`design-system.config.ts` (that one's "which doc-page variant shows"; this one's "which product
feature does a given role see") and deliberately just data - a `FeatureKey -> UserRole[]` map the
user owns and edits directly, not something to restructure without asking.

- **Build every feature as if for `biodata-admin` first, gate down from there.** `biodata-admin`
  always passes access checks (see the bypass in `hasFeatureAccess`) - it's the "everything
  visible" baseline. A feature only needs a `roleAccessMatrix` entry once it's actually meant to
  be restricted for some other role; an ungated feature is visible to everyone by default.
- **`useFeatureAccess(feature)`** (`lib/use-feature-access.ts`) is the call site API - combines
  `useUserRole()` with `hasFeatureAccess()`. Same `<Suspense>` requirement as `useUserRole` itself.
- **Don't invent matrix entries ahead of being told.** Every entry below was added only once the
  user said a feature is actually restricted - what else should and shouldn't be gated is still
  being specified, and doubly so for whatever's decided for `public-user` vs `registered-user`
  within current build focus.
- **`orgSwitcher`** (the breadcrumb's `[ORG ▾]` pill), gated to
  `["privileged-user", "privileged-admin", "biodata-user"]` (`biodata-admin` gets it too, via the
  bypass). Every org-affiliated role, in other words - `registered-user` and `public-user` are
  the only two with no organisation to switch between, which is also why it correctly stays hidden
  for both roles in current build focus without needing any focus-specific logic - the matrix
  already says so. It was in the original dashboard mockup unconditionally, but that mockup wasn't
  role-accurate.
  - **The pill's own text isn't always "ORG" - `Breadcrumb`'s `orgLabel` prop (`components/
    scaffold/breadcrumb.tsx`), not a `showOrgSwitcher` boolean rendering a hardcoded string.**
    `biodata-admin`/`biodata-user` *are* DEW - a real, fixed, known org - so their pill says "DEW"
    (`orgLabelForRole` in `lib/user-role.ts`); `privileged-admin`/`privileged-user` are affiliated
    with one of several partner orgs (Birds SA, Adelaide Hills Landcare, ...) with no single real
    logged-in org to name in this exploratory build, so "ORG" stays the honest generic placeholder
    for them. Flagged directly by the user. Verified live across all three option-1 shells and all
    4 org-affiliated roles via curl, not just by reading the code.
- **`metricCardCustomization`** (the Flora and Fauna Dashboard's per-card three-dot menu, see
  `app/pages/_shared/data-overview.tsx`), gated to `[]` - `biodata-admin` only, via the bypass,
  nobody else. Flagged directly by the user: in the real product only the admin can reconfigure
  which metric sits in which of the 4 KPI card slots, and that choice flows through to every other
  role's own view - it's not a personal preference each signed-in user sets for themselves, the way
  the dropdown was originally built. `useFeatureAccess("metricCardCustomization")` hides the
  three-dot button entirely for every role but `biodata-admin`; there's no shared backend in this
  exploratory build to actually persist an admin's choice and flow it through to other roles, so
  `metricOrder` still starts from the same `defaultMetricOrder` regardless of who's looking - what's
  fixed is *who can see the control*, not a simulation of cross-role persistence that doesn't exist
  yet. Verified live: 0 three-dot buttons render for `registered-user`, 4 render for
  `biodata-admin`.
- **`option-2` doesn't read the role or the matrix yet** - nothing on it is role-gated so far.

## Known gaps / loose ends (as of the Avatar build)

- **`GlobalProjectSearch`'s scope was narrowed to match what's wired up (projects only) instead of
  honestly stating the real intended scope ("projects, datasets or species") - reversed.** Flagged
  directly by the user: the placeholder/label undersold the control's real scope. Fixed by keeping
  functionality projects-only (no example content exists for Datasets/Species yet) but adding real,
  named, `isDisabled` "Datasets"/"Species" rows with a "Coming soon" note to the prompt and
  no-results states (`scopeNoticeItems` in `app/pages/_shared/global-search.tsx`) - acknowledges the
  real breadth without faking search results for either. See that file's own comment for the full
  reasoning; this reverses an earlier decision documented there.
- **`Tabs`' `button-brand` type previewed the selected look on hover - fixed at the component
  level, not per-instance.** `components/application/tabs/tabs.tsx`'s `getTabStyles` applied the
  exact same classes for `isHovered` and `isSelected` (`(isSelected || isHovered) &&
  "bg-brand-secondary text-brand-secondary ..."`) - every other `button-*` type does the same
  merge, but `button-brand` is the one actually used for real IA navigation in this build (the
  Home and Projects contextual-sidebar switchers on `dashboard/option-1`/`project-list/option-1`/
  `project-detail/option-1`), where it sits directly next to the primary icon rail. The icon rail
  keeps hover (`bg-tertiary`/`text-primary`, neutral) visually distinct from active
  (`bg-brand-solid`/white, strong); the Tabs switcher's hover instead looked identical to already-
  selected. Flagged directly by the user off a screenshot comparing the two columns. First attempt
  fixed it per-instance (a `navSwitcherTabClassName` helper forcing `!important` overrides on each
  `<Tab>`) - reverted once the user asked for it "on a design system level": `button-brand` now
  splits into two distinct, mutually-exclusive branches (`isHovered && !isSelected` vs.
  `isSelected`), so hover gets the icon rail's own `bg-tertiary`/`text-primary` treatment and
  selected keeps `bg-brand-secondary`/`text-brand-secondary` - fixing every consumer at once
  (all 3 option-1 shells' Home/Projects switchers, plus `/components/tabs`'s own doc-page demo of
  the type) instead of patching call sites. `NavTree` (the plain-`Link`-based sibling list next to
  these switchers) isn't a `Tab` and so couldn't inherit the fix automatically - its own hover was
  mirrored by hand in all 3 files, from `hover:bg-brand-secondary hover:text-brand-secondary`
  (previewing its own `isCurrent` fill, the same bug) to `hover:bg-tertiary`. Other `button-*`
  types (`button-gray`/`button-border`/`button-minimal`) and `underline`/`line` were deliberately
  left alone - not reported broken, and changing their hover behaviour wasn't asked for.
  `*:data-icon:text-primary` (not `text-fg-primary`) is the real, working icon-color token here -
  confirmed via the compiled CSS output (`.next/dev/static/chunks/*.css`) that `--color-fg-primary`
  doesn't exist in `app/globals.css` at all (only `fg-secondary`/`tertiary`/`quaternary` do), while
  bare `text-primary` is a real hand-authored `@utility` against `--ui-text-primary` - two parallel
  colour namespaces in this codebase, worth checking directly against the compiled stylesheet
  rather than assuming a token exists by naming-convention alone.
- **Avatar's whole family shipped without `font-barlow` - fixed, all 4 files.** Flagged by the
  user directly off a screenshot of the Avatar Playground: the "OW" fallback initials were
  rendering in Geist, not Barlow. `components/base/avatar/avatar.tsx` never had `font-barlow` on
  its root div - every other DEW component (`button.tsx`, `badges.tsx`, `checkbox.tsx`,
  `tooltip.tsx`) bakes it into the root className, this one was simply missed at ingest time.
  Checked the rest of the Avatar family for the same gap rather than stopping at the one file the
  screenshot pointed at: `avatar-label-group.tsx` (title/subtitle text, fixed on the `<figure>`
  root), `avatar-profile-photo.tsx` (its own separate initials fallback, fixed on its root),
  and `base-components/avatar-count.tsx` (the numeric count badge, fixed). Left untouched:
  `avatar-company-icon.tsx`, `avatar-add-button.tsx`, `verified-tick.tsx`,
  `avatar-online-indicator.tsx` - all icon/image-only, no rendered text to mis-font. Verified
  `tsc`/`eslint` clean. This is the second time a `font-barlow` gap has surfaced after the fact
  (Button/Checkbox/Tooltip during the 7-page rollout, now Avatar) - worth a deliberate sweep of
  every `components/base/**` and `components/application/**` root for the class next time a
  batch of components is touched, rather than waiting for it to be spotted per-component.
- **Button audited against Figma (node 101:22618 "Buttons", frames "Buttons/Button" 101:20844
  and "Buttons/Button destructive" 101:21443) - one variant trimmed, one focus-ring token fixed,
  everything else already correct.**
  - **Sizing was already exact.** sm/md/lg/xl compute to 36/40/44/48px (padding + text
    line-height) and match Figma's fixed symbol heights precisely - no fix needed. Padding
    (px-3.5/py-2.5 for md) matches Figma's `px-[14px] py-[10px]` exactly too.
  - **`xs` isn't a documented Figma variant, anywhere, for any hierarchy or state** - only
    sm/md/lg/xl symbols exist in the frame. Same situation as Select's `lg` (already trimmed,
    see "Figma is the source of truth" above): kept in the real component's type signature and
    the API table (`"xs" | "sm" | "md" | "lg" | "xl"`, still a real, working prop), but removed
    from `config/design-system.config.ts`'s `button.sizes` array and from the hardcoded
    `size="xs"` instance in the "Icon only" Variants section - it no longer appears in the
    Playground, the Sizes grid, or anywhere else it would be presented as a demonstrated option.
  - **`--ui-outline-error` / `--ui-outline-error_subtle` were still error-200/100** - the
    sibling tokens `--ui-ring-error` / `--ui-ring-border-error` were fixed to error-500/300
    earlier this session (see the destructive text-field border entry below), but `outline-error`
    - used by all four destructive `Button` colour variants' focus-visible ring, and by
    `InputNumber`'s invalid+focused outline - was missed at the time. Confirmed via this frame's
    `Focus rings/focus-ring-error` = `#F04438` (error-500). Fixed both to match the same
    subtle/full split already established (300/500). A reminder that a token fix found via one
    component's Figma frame doesn't automatically catch every sibling token with a similar name -
    grep for other tokens in the same family (`ring-error*` vs `outline-error*` here) when fixing
    one of them, not just the one the current audit happened to be looking at.
  - Two more gray-scale anchors surfaced incidentally while reading this frame's token dump:
    `text-secondary_hover` = `#423e3b` (maps to the previously-unconfirmed gray-800) and
    `bg-primary_hover` = `#fcfcfc` (maps to gray-25, also previously unconfirmed) - both added to
    the gray-scale evidence entry below. That leaves the full `--color-gray-*` scale at 10 of 12
    (or 11, depending how `bg-primary_hover`'s exact step is read) steps confirmed - still not
    applied, still the same pending decision.
- **Avatar and Badge audited against Figma (nodes 100:20529 "Avatars" and 100:20835 "Badges") -
  three real bugs found and fixed, one systemic colour gap partially closed, one open question
  raised.**
  - **`Avatar`'s fallback border was the wrong mechanism.** Figma's "Avatar" frame (node
    99:18380) confirmed two distinct, deliberate border treatments: a real image gets
    `border: rgba(0,0,0,0.08)` (verified on node 99:18516); a fallback (initials, node 99:18405,
    or icon, node 99:18453) gets a real `border-secondary` token border, not a black-alpha one.
    Code applied `outline-black/16` unconditionally to both cases - 2x too strong for images, and
    the wrong colour entirely for fallbacks. Fixed in `components/base/avatar/avatar.tsx`,
    keeping the existing `outline` mechanism (zero layout risk) but making the colour
    conditional: `canShowImage ? "outline-black/8" : "outline-[var(--ui-border-secondary)]"`.
    Note: the fallback case's *exact* pixel colour won't be correct until `--color-gray-200`
    itself is fixed (see the gray-scale entry below) - the token reference is correct now, the
    primitive it points to isn't yet.
  - **Badge's vertical padding was roughly a third of spec, sitewide, across every sub-component.**
    Figma's "Badge" frame (node 100:20530) confirmed `py` per size: sm = `spacing-sm` (6px), md =
    `spacing-lg` (8px), lg = also 8px (same as md - only horizontal padding and font-size grow
    from md to lg, not vertical) - checked against 3 separate symbols (sm/md/lg "Pill color").
    Code had `py-0.5` (2px) for sm/md and `py-1` (4px) for lg, uniformly, across `Badge`,
    `BadgeWithDot`, `BadgeWithIcon`, `BadgeWithFlag`, `BadgeWithImage`, and `BadgeWithButton` (42
    lines). Fixed to `py-1.5`(sm)/`py-2`(md)/`py-2`(lg) throughout. `BadgeIcon` (the icon-only,
    no-text variant) was independently verified correct already - its padding math already
    matched Figma's fixed pixel sizes (22/24/28px) exactly, nothing to fix there.
  - **Badge's `lg` size used `text-sm` (14px) where Figma specifies `text-md` (16px).** Confirmed
    on both "Pill color" (node 100:20591) and "Badge Color" (node 100:20593) lg symbols - font
    size scales sm→md→lg (12/14/16px) even though vertical padding doesn't. Fixed all 10
    occurrences, including the two easy-to-miss ones nested under `BadgeWithIcon`'s
    `lg: { trailing, leading }` object (a flat `grep -n 'lg:.*text-sm'` doesn't catch nested keys
    - check structurally, not just by line prefix, next time a similar sweep is needed). Not
    fixed: Figma's lg line-height is 20px (text-sm's line-height) paired with the 16px font-size,
    not text-md's native 24px - a genuine but sub-4px, likely-imperceptible mismatch, left alone
    rather than adding 10 arbitrary `leading-[20px]` overrides for it.
  - **`--color-utility-neutral-*` (Badge/Tag's "gray") was Untitled UI's stock cool palette,
    while the sibling utility scales (brand/warning→yellow/success→green/error→red) were already
    exactly correct.** Confirmed directly against Figma's "Badge" frame variable dump
    (`Component colors/Utility/Gray/utility-gray-700` = `#585451`, `-500` = `#8f8b87`, `-200` =
    `#e5e4e2`) - the same three values independently confirmed via the Input, Checkbox/Radio, and
    Avatar frames too (four-way agreement). Fixed the four steps Badge actually consumes
    (50/200/500/700) in `app/globals.css`; left `-300` untouched since nothing in this codebase
    reads `utility-neutral-300`. This is a *separate, smaller* fix from the still-pending full
    `--color-gray-*` primitive rewrite below - contained to Badge/Tag's own utility namespace, not
    the sitewide text/border/background scale.
  - **Badge's `modern` type and 7 of its 12 colours were undocumented in Figma - trimmed.**
    Figma's "Badge" frame (node 100:20530) only documents two types - "Pill color" and "Badge
    Color" - across 5 colours (Brand/Warning/Success/Error/Gray). There is no "Modern" type symbol
    anywhere in this frame, and no swatches for the other 7 colours (slate/sky/blue/indigo/purple/
    pink/orange) `Badge`'s config previously offered. Per "Figma is the source of truth", trimmed
    `modern` and the 7 extra colours out of `config/design-system.config.ts`'s `badge.types`/
    `badge.colors` (both stay real, working values in `badges.tsx`/`badge-types.ts` and in the API
    table - never invent or drop a prop, just don't demonstrate what isn't documented), and removed
    the now-dead `isModernPlain` branching in `app/components/badge/page.tsx`'s Playground and
    Types section. Verified via `tsc`/`eslint` clean and a full-page screenshot. This had briefly
    been raised as an open question instead of acted on directly - corrected: "trim to match Figma"
    is a non-negotiable contract, not something to flag and wait on. These checks exist for one
    reason - confirm the shipped styling matches the brand guide - not to weigh whether an
    undocumented variant might be intentional.
- **Figma's "ICONS / Supporting Icons" section (node 97:17449) has two families, not one.**
  "Featured icon" (node 97:16118) + "Featured icon outline" (node 97:16339) are a real, already-
  ingested DEW component - `FeaturedIcon` in `components/foundations/featured-icon/featured-icon.tsx`
  - and match Figma exactly (sizes 32/40/48/56 for sm/md/lg/xl, themes light/gradient/dark/modern/
  modern-neue plus `outline` as its own frame, colours brand/gray/error/warning/success). Documented
  on `/primitives/icons` under a new "Featured icons" section per the user's request to add
  supporting icons there, rather than spinning up a separate `/components/featured-icon` page - it
  hadn't had any doc page before this (only used internally by `Alert`/`Toast`).
  **The demo glyph must be Figma's actual one, not a convenient substitute.** First pass used
  `Bell01` for every swatch - wrong, and caught immediately: `get_design_context` on the frame's
  own example (node 97:16119) shows Figma's real default is `check-circle` (Untitled UI's
  `CheckCircle`, already in `@untitledui/icons` - no new asset needed), with an explicit
  `iconSwap` prop documenting that the container is icon-agnostic but the *reference example* is
  not arbitrary. Swapped to `CheckCircle` across all three Featured Icon demo blocks. This
  generalises: **when documenting any component that wraps or is documented alongside a specific
  Figma-chosen glyph, pull the exact icon Figma used via `get_design_context`/screenshot before
  writing the demo - never default to whatever icon happens to already be imported on the page.**
  These demo choices get treated as canon and inherited by other components/screens that copy the
  pattern, so a wrong default doesn't stay contained to one page.
  "File type icon" (node 97:16420) is a *different* thing entirely: ~100+ real exported SVG assets
  (a coloured "page" shape per format/type, e.g. Image/JPG/PNG/SVG, Document/PDF/DOCX/XLSX,
  Design/FIG/PSD/AI, Media/MP3/MP4, Archive/ZIP, Development/HTML/JS/JSON, …, each in Default/Gray/
  Solid) with a baked-in text label (confirmed via `get_design_context` on node 97:16796 - a real
  `<img src=".../asset/....svg">`, not something drawable from a token). No component exists for
  this yet. Per the Figma-to-code rule "never hand-write or inline `<svg>`/`<path>`, you don't have
  the real vector data" - this was **not** built as part of this pass; it needs its own ingest
  (download and commit every real asset, build a `FileTypeIcon` component with `fileType`/`type`
  props) which is a meaningfully larger, separate task from "add supporting icons to the Icons
  page." Flagged here rather than faked or silently skipped.
- **`--ui-ring-focus-ring` / `--ui-outline-focus-ring` were brand-300 - now fixed to brand-500.**
  This was flagged as "unaudited against Figma" in a `globals.css` comment when the brand text-field
  ring was first fixed; confirmed and closed via Figma's "Checkbox" frame (node 95:15178, also
  documents Radio - both types share one frame). Its focus-ring effect on a focused control (e.g.
  node 95:15375) is a two-layer shadow: `0 0 0 2px bg-primary` (the white gap) then
  `0 0 0 4px Colors/Effects/Focus rings/focus-ring` (`#2A667C`, brand-500) - same colour as the
  text-field ring, just a different token because it's applied via `outline`/`ring` box-shadow on
  discrete controls rather than the text-field's own ring. The 2px-gap-then-2px-ring *width* was
  already correct (`outline-2 outline-offset-2` numerically matches spread 2 -> spread 4); only the
  colour was wrong. Fixed at the token level, so it corrected every consumer at once: `Checkbox`,
  `RadioButton`, `Toggle`, `CloseButton`, `SelectItem`, `Tags`/`TagCheckbox`/`TagCloseX`,
  `AvatarAddButton`, `Badges`, `InputTags`, and `components/scaffold/controls.tsx`. Verified live
  via `getComputedStyle` on a keyboard-focused Radio (`rgb(42, 102, 124)` = `#2a667c`, exact match).
  Also checked while there: Figma's Default vs. Hover states for both Checkbox and Radio (nodes
  74:573/74:579) are visually identical except for `cursor-pointer` - no hover-specific colour
  change needed, and the shipped components already have `cursor-pointer` unconditionally, so
  there was nothing to fix on that front.
- **`Avatar`'s `contrastBorder` prop is dead.** It's declared in `AvatarProps` but never
  destructured or used in `components/base/avatar/avatar.tsx`. It's documented in the API
  table for accuracy (that's the real type signature), but don't build a Playground control
  or Variants demo around it - it currently does nothing. Worth reporting upstream or wiring
  up if it's ever needed.
- **No real Figma links exist for any installed component yet.** The Figma section on every
  page should ship as an honest "not linked yet" placeholder until real file/frame URLs are
  available - never fabricate one.
- **`Select` and `Toggle` are both installed now** - `SegmentedControl` in
  `components/scaffold/controls.tsx` still stands in for the *Playground's own* size/status
  controls (per "DEW vs. Scaffold": a control that operates a demo is Scaffold even once a real
  DEW equivalent ships), but every doc page's own Variants sections now use the real components.
- **`Select`'s ingest (`components/base/select/**`) fixed two unresolved tokens copy-pasted from
  Input's pattern:** `to-bg-primary` (a gradient-stop utility - `bg-primary` isn't a `--color-*`
  theme entry, so `to-*` can never resolve it) and `caret-alpha-black/90` (no `alpha-black` token
  exists anywhere in this system). Both were rewritten as arbitrary-value token references -
  `to-[var(--ui-bg-primary)]` and `caret-[var(--ui-text-primary)]` - in `combobox.tsx`,
  `tag-select.tsx`, and `multi-select.tsx`. The identical pattern still exists, unfixed, in
  `components/base/input/input.tsx`, `input-date.tsx`, and `input-tags.tsx` (that's where Select's
  copy came from) - low visual impact (the effect just silently no-ops rather than breaking
  anything) but worth the same fix next time one of those files is touched.
- **No em-dashes in this file or in doc-page copy.** Use a hyphen (`-`) instead. Applies to
  prose written here and in component pages alike.
- **Placeholder person convention:** use the fictional **Olivia Wyatt** / initials **OW** for
  any demo that needs a single person's name, email, or initials - never the current user's real
  identity. This was fixed once already (an avatar demo leaked a real name/email) - don't
  reintroduce it when building new components that need a "user" example. For a demo that needs
  *multiple* distinct people (a multi-select, an assignee list), pair Olivia Wyatt with other
  Untitled UI's own established placeholder personas - e.g. **Phoenix Baker**, **Lana Steiner** -
  rather than inventing new fictional names; they're already the recognisable, unambiguously-fake
  identities this whole component library is built on (see `Select`'s "with avatar"/multi-select/
  tag-select demos). The `biodata-admin` persona's own greeting (`AdminHomeDashboardContent` in
  `app/pages/_shared/home-dashboard.tsx`) uses **Jane** for the same reason Olivia Wyatt exists for
  registered-user - a different placeholder identity per persona keeps "Hi, X" honest about which
  role is looking at the screen, flagged directly by the user when the admin dashboard was
  promoted.
- **Dev server terminal noise:** `next.config.ts` sets `logging.incomingRequests: false` and
  `logging.browserToTerminal: false` to keep `next dev` output readable. If you're debugging
  something that needs those (e.g. chasing a specific request or a browser console error),
  temporarily re-enable rather than assuming they're unavailable.
- **Playground/panel rollout is complete for every built component page.** Avatar, Toggle,
  Select, and Radio buttons had it first; Alert, Avatar, Badge, Button, Checkbox, Input, Toast,
  and Tooltip got it in one batched pass (built in parallel by separate agents, one page each,
  each independently verified against "DEW vs. Scaffold" and the rest of the "Final check"
  contract). Only `Modal` remains Variants-only, since it has no real content yet at all
  ("Documentation coming soon" placeholder) - give it the full pattern from the start once it's
  actually built, don't build it Variants-only and roll Playground in later.
  - **Two DEW/Scaffold violations survived the parallel build and had to be caught in a manual
    sweep afterward**, both the same shape: a real `Button` used as a Tooltip/Toast trigger
    inside *pre-existing, preserved* Variants content (not the new Playground, which both pages
    got right) - a demo-operating trigger is Scaffold even when it's wrapped by a real DEW
    component that functionally requires a focusable child (`Tooltip` needs its own
    `TooltipTrigger` export to wire up hover/focus correctly - the fix was `TooltipTrigger` with
    Scaffold-only visual classes, not a bare Scaffold button, and not a real `Button`). Toast's
    fix was simpler (`ScaffoldButton` slots in directly, no functional dependency). **When
    rolling this pattern out to a page with pre-existing content, grep the finished file for
    every real component import used as a trigger/operator, not just the new Playground section**
    - "preserve existing content" is not the same as "existing content was already correct."
  - **A parallel batch is exactly where a stray regression hides.** A `font-barlow` fix
    surfaced independently in `Button`, `Checkbox`, and `Tooltip`'s real components (all three
    were missing it in the working tree relative to the last commit, restored to match HEAD
    exactly - confirmed via empty `git diff` afterward). The first two were caught and fixed by
    the agents that touched those pages; the third (`components/base/tooltip/tooltip.tsx`) was
    missed by its own agent's report and only surfaced in the human's post-batch `git status`/
    `eslint` sweep. Always run that sweep after a parallel batch, even when every individual
    agent self-reports clean - "I didn't touch that file" is a claim to verify, not trust.
- **`Radio buttons`' ingest (`components/base/radio-buttons/radio-buttons.tsx`) fixed two gaps:**
  the root `AriaRadio` className was missing `font-barlow` (every other DEW form component -
  `Checkbox`, `Input`, `InputNumber` - carries it; this one shipped without it), and `RadioGroup`
  accepted an `orientation` prop that reached react-aria's state correctly (keyboard nav, the
  `data-orientation` DOM attribute) but had no visual effect - its wrapper was hardcoded to
  `flex flex-col`, so `orientation="horizontal"` never actually laid options out in a row. Fixed
  by adding `data-[orientation=horizontal]:flex-row` alongside the existing `flex-col`. Caught by
  actually clicking the Playground's own Orientation control after building it, not by reading
  the source - a reminder to interact with every new Playground control at least once before
  calling an ingest done, the same way a dead prop like `Avatar`'s `contrastBorder` only shows up
  when something tries to use it.
- **No Figma frame found for Radio buttons.** The `get_metadata`/`get_design_context` MCP tools
  only see pages the Figma desktop app currently has loaded, not the whole file - "DS Sandbox"
  (node 65:1317, used for the Input/border-colour audits) doesn't contain a Radio frame, and a
  broader page-level search came up empty too. Shipped with an honest "not linked yet" Figma
  section rather than blocking the ingest on an unreliable search - revisit if a Radio frame
  turns out to exist elsewhere in the file.
- **`/test-site-details` has a `?`-blocked Radio field** (per "Generated screens" above, from
  before this component was ingested). Now that `components/base/radio-buttons/**` is real, that
  placeholder is a candidate to swap for the real component - not done as part of this ingest,
  since it's a separate screen with its own review cycle, but worth doing next time that screen
  is touched.
- **Gray/neutral primitive scale (`--color-gray-*`) was Untitled UI's stock cool palette, not
  DEW's real warm-gray one - now applied, 11 of 12 steps.** Confirmed via Figma's own resolved
  variables, independently, across five separate frames (Input's "Input field" sandbox node
  65:1317; Checkbox/Radio's "Checkbox" frame node 95:15178; Avatar's "Avatar" frame node
  99:18380; Badge's "Badge" frame node 100:20530; Button's "Buttons/Button" frame node
  101:20844) - the same agreement that made the `--color-utility-neutral-*` fix above safe to
  apply on its own. Applied directly in `app/globals.css`: 900 `#2e2925` (was `#101828`), 800
  `#423e3b` (was `#1D2939`), 700 `#585451` (was `#344054`), 600 `#706b68` (was `#475467`), 500
  `#8f8b87` (was `#667085`), 400 `#b5b2af` (was `#98A2B3`), 300 `#d2d0ce` (already correct,
  untouched), 200 `#e5e4e2` (was `#EAECF0`), 100 `#f2f2f1` (was `#F2F4F7`), 50 `#f8f8f7` (was
  `#F9FAFB`), 25 `#fcfcfc` (was `#FCFCFD`). 950 left untouched - unconfirmed, and nothing in this
  codebase reads it. Since every component's text/border/background reads through
  `--color-gray-*`, also swept the whole repo for hardcoded hex literals that had been documenting
  the old values (doc-only "value" columns in inspector/token tables, which duplicate a hex next
  to a token name rather than reading the CSS var live) and updated them to match: the primitives
  Gray swatch list (`app/primitives/colours/page.tsx`, which was already out of sync even on
  `gray-300` before this fix), Tooltip's token anatomy table, Input's focus-ring state table, and
  both `/test-*` pages' inspector token tables (including an unrelated stale `ring-brand` entry
  in `test-page` still showing the pre-fix `brand-300` value instead of the already-corrected
  `brand-500` - fixed in the same pass since it was found while sweeping). Verified with `tsc`
  clean, `eslint` clean, and every touched route returning 200 from a local dev server.
- **Destructive/error border tokens were one to two shades too pale - now fixed.** Same bug class
  as the brand-ring fix documented above, just missed for the error state at the time. Figma's
  resting-invalid Input (node 91:13669) uses `border-error_subtle` = `#fda29b` (error-300);
  focused-invalid (node 91:13879) uses `border-error` = `#f04438` (error-500). Code had
  `--ui-ring-error_subtle`/`--ui-ring-border-error_subtle` at error-200 and
  `--ui-ring-error`/`--ui-ring-border-error` at error-300 - both bumped up to match. Fixed at the
  token level in `globals.css`, so it corrected `Input`, `Select`, `ComboBox`, `MultiSelect`,
  `TagSelect`, `PinInput`, `InputDate`, `InputTags`, `InputGroup`, and the destructive `Button`
  variant all at once. Verified live via `getComputedStyle` on a rendered error input.
- **First `/pages/<page-name>` build: `/pages/dashboard`, reconstructing the "BioData SA"
  dashboard shell (Figma node 103:105, file `SQ58QgwP9Xz0uo3tBpuf6e`).** The first instance of
  the new route convention documented above - proved out the "nav chrome is exempt, contained
  widgets aren't" split in practice. Real DEW used for every contained widget: `Input` (search
  field, `icon`/`tooltip` props doing double duty for the leading search glyph and the trailing
  help icon - no separate `Tooltip` composition needed, it's already built into `Input`), `Button`
  (`color="primary"` for "Upload a dataset", `color="secondary"` for "Action 2" and the four
  quick-action buttons), `Avatar` (`initials="OW"`, Olivia Wyatt, matching the "Hi, Olivia"
  heading), and `AlertFullWidth` for the info banner - its title/description/confirmLabel are all
  required props even though the banner only carries one line of copy and never wires `onConfirm`,
  same allowance already established for `AlertFloating`/`AlertFullWidth` elsewhere; `onClose` is
  wired for real (dismisses the banner). The banner's own text, "This is where alerts go", is
  itself a Figma placeholder instruction, not real copy - rendered verbatim as the title, same
  convention as `/test-site-details`' literal `[Custom field name]`. One genuine gap: the
  date-range control (chevron-left / calendar / range-text / chevron-right, styled like an Input)
  has no real match - `input-date.tsx` is a single-value `DateField` driven by react-aria
  `DateSegment`s, not this prev/range-text/next composition - `?`-blocked as `GapDateRange`, same
  shape as `/test-site-details`' `GapField`. The primary icon rail, contextual sidebar, breadcrumb,
  and footer links were built as simplified structural placeholders per the new section's nav-chrome
  exemption - not pixel-matched, not `?`-blocked, since the surrounding IA isn't decided yet. The
  KPI row, four metric cards, filter panel, and map-view panel are structural shells composed from
  real tokens (`border-secondary`, `text-primary`, `text-quaternary`, `rounded-lg`) - `?`-blocking
  a whole section would swallow everything inside it, same reasoning as `/test-site-details`'
  `Accordion`; all logged in the mapping table as composed, candidates for future ingest. The
  yellow "GENERAL NOTES" sticky note (node 103:225, a designer's comment layer with "Patterns" /
  "ALA left filters" text) was excluded entirely, per the new section's annotation rule - it's not
  product UI. One real asset had no DEW equivalent: the Government of South Australia / DEW crest
  image (node 103:108) - downloaded and committed to `public/pages/dashboard/gov-sa-dew-logo.png`
  rather than left as a placeholder, per the figma-design-to-code skill's asset rule, and cropped
  in code to match Figma's own 44px sprite framing. Not added to `lib/nav.ts`, per the new
  section's own rule. Verified `tsc`/`eslint` clean (repo-wide `eslint` shows pre-existing errors
  in unrelated files - `input.tsx`, `input-tags.tsx`, `tooltip.tsx`, `config-context.tsx`,
  `tag-select.tsx`, `tags.tsx`, `postcss.config.mjs` - untouched by this build, confirmed via
  `git status`) and the route returning 200 with real rendered content from a local dev server.
- **The Untitled UI CLI ingest that brought in `components/base/radio-groups/**` silently
  reverted 8 already-fixed, committed files back to stock Untitled UI - caught before it could
  land.** `avatar.tsx`, `avatar-company-icon.tsx`, `avatar-count.tsx`, `avatar-online-indicator.tsx`,
  `badges.tsx`, `button.tsx`, `checkbox.tsx`, and `tooltip.tsx` all showed up modified in the
  working tree despite nobody touching them - every diff stripped a real, previously-audited DEW
  fix (dropped `font-barlow`, reverted `Avatar`'s `rounded` prop and outline-colour fix, reverted
  `Badge`'s Figma-audited padding back to stock `py-2`, rewrote `Button`'s whole prop-typing
  approach). Exactly the "parallel batch is exactly where a stray regression hides" pattern
  documented earlier in this file, just triggered by a CLI re-run instead of a parallel agent
  batch - **any CLI ingest can silently touch shared files beyond the component being installed,
  not just brand-new ones, so `git status`/`git diff` after every ingest is not optional.** Fixed
  by `git checkout --` on all 8 files to restore them to `HEAD` exactly (confirmed via `git diff`
  showing no changes to them afterward) before touching the new component at all.
- **`radio-groups` ingest (`components/base/radio-groups/**`, 6 files: `radio-group-icon-simple`,
  `radio-group-icon-card`, `radio-group-avatar`, `radio-group-payment-icon`,
  `radio-group-radio-button`, `radio-group-checkbox`, re-exported as `IconSimple`/`IconCard`/
  `Avatar`/`PaymentIcon`/`RadioButton`/`Checkbox` from `radio-groups.tsx`) fixed two gaps, both
  the same recurring shape already logged for Avatar and Radio buttons above.** (1) None of the 6
  files had `font-barlow` on their `AriaRadio` item root - added to all 6, same fix location as
  `RadioButton` in `components/base/radio-buttons/radio-buttons.tsx`. (2) All 6 referenced a
  `disabled`-token family that has never existed in this repo's token layer at all -
  `bg-disabled_subtle`, `ring-disabled`, `ring-disabled_subtle`, `bg-disabled`, `text-fg-disabled`,
  `bg-fg-disabled_subtle` - none defined in `app/globals.css` or `styles/theme.css` (confirmed via
  grep, zero hits), so every disabled card rendered with no visual treatment beyond
  `cursor-not-allowed`, silently. Rather than inventing six new tokens nothing else in DEW uses,
  brought them in line with the disabled pattern every other DEW form control already uses
  (`Checkbox`, `RadioButtonBase`, `ToggleBase`: `cursor-not-allowed opacity-50`, nothing more) -
  removed the undefined classes and their inner-element echoes (a disabled `FeaturedIcon` override,
  a disabled inner-dot fill) since the outer `opacity-50` already dims every descendant. No Figma
  frame exists for this component (same as Radio buttons) - shipped with an honest "not linked
  yet" Figma section. `RadioButton`'s and `Checkbox`'s item types both declare an `icon` field
  that the component never renders - left as-is and documented in the API table for accuracy, same
  precedent as `Avatar`'s dead `contrastBorder` prop, not silently dropped or wired up beyond
  scope. Slotted alphabetically: `radio-groups` in `config/design-system.config.ts` and
  `lib/nav.ts` between `radio-buttons` and `select`. Doc page built at
  `app/(docs)/components/radio-groups/page.tsx` following the established template - Playground
  with a type/size/disabled control set, a Types section demonstrating all 6 layouts, Sizes,
  Disabled, a shared common-props table plus one item-shape table per variant, Usage, Figma.
  Verified `tsc`/`eslint` clean and the route rendering all 6 variants with real content
  (including the Olivia Wyatt/Phoenix Baker/Lana Steiner placeholder trio for the Avatar variant)
  from a local dev server.
- **`table`/`dropdown` ingest audited against Figma ("Application Components", node 1:83267 -
  header cell, cell-type catalog, and full table examples frames) - one real bug found and fixed,
  one gap logged rather than silently built or silently dropped.**
  - **`TableCardHeader`'s count badge, and this page's own "Status" cell demo, used
    `type="modern"`.** Figma's "Team members" reference (the exact example this system's own demo
    mirrors) shows both as filled colour pills - the count badge light-gray, the status badge a
    dot + green pill for "Active." `Badge`'s `modern` type strips colour entirely regardless of
    the `color` prop passed (`bg-primary text-secondary ring-primary`, a neutral ghost badge) -
    the wrong type for either use. Fixed `TableCardHeader` in
    `components/application/table/table.tsx` to drop `type="modern"` (falls back to the default
    `"pill-color"`, the filled style), and fixed `app/(docs)/components/table/page.tsx`'s status
    cell to use `BadgeWithDot` instead of a plain `Badge`, matching Figma's dot-plus-pill
    treatment exactly. The **default** `Badge` usage elsewhere (the "Basic table" example,
    `project-list-content.tsx`) was already correct - `type="modern"` is a real, intentional
    variant for other contexts, it was just wrong here.
  - **Figma documents three distinct row-action cell patterns - only one is built.** The "Table
    cell" frame (node 1:84338) has "Action dropdown icon" (a single "..." trigger + menu - what
    `TableRowActionsDropdown` implements), "Action icons" (a row of bare icon buttons, no
    dropdown), and "Action buttons" (text links, e.g. "Delete"/"Edit"). Figma's own "Team members"
    example - the one this page's "Data table" demo mirrors - actually uses "Action icons," not
    the dropdown. Per "Figma is the source of truth," this is exactly the kind of thing that
    would normally get fixed on sight rather than logged - not done here because it's a genuinely
    separate, larger piece of work (a new component, not a token/prop tweak): building "Action
    icons"/"Action buttons" as ready-made pieces the way `TableRowActionsDropdown` already is for
    the dropdown pattern. Logged instead of silently built or silently ignored; noted directly in
    the doc page's own copy so it doesn't read as a false 1:1 claim against Figma.
  - **`components/base/table/table.tsx` (the plain primitive) also didn't match Untitled UI's
    real table styling before this pass, unrelated to the Figma node above** - it predates this
    audit and was corrected the same session per the user's direct report, not from this Figma
    frame: `uppercase tracking-wide` header text (Figma/the real `components/application/table/
    table.tsx` reference both use plain sentence-case), no header background (added `bg-secondary`),
    real `border-b`/`divide-y` row borders (switched to the same `after`-pseudo-element pattern
    the application-level table already uses, so borders don't take up layout space), `text-primary`
    body text by default (switched to `text-tertiary`, matching the "only the identity column gets
    promoted to primary" convention already used everywhere else), and `outline-brand` focus rings
    (switched to `outline-focus-ring`/`ring-focus-ring`, the token every other focusable component
    uses). While fixing this, also found `application/table.tsx`'s row-selection highlight
    (`selected:bg-secondary`) was silently dead - `selected:` is a `tailwindcss-react-aria-
    components` plugin variant, and that plugin is only registered in an orphaned
    `styles/globals.css` that nothing imports (the live stylesheet, `app/globals.css`, is fully
    self-contained and never pulls in `styles/*.css` at all). Fixed both the primitive's and the
    application-level table's copy of this to `aria-selected:bg-secondary` (a core Tailwind
    variant, no plugin needed, reads the same attribute React Aria sets) rather than wiring up the
    unused plugin registration - a bigger, separate infrastructure call left flagged, not made
    unilaterally.
- **`tabs` ingest (`components/application/tabs/tabs.tsx`, composed with `Badge`) ran the full QA
  check before docs were written, per the workflow above - caught 6 dead/wrong utility classes and
  a missing `font-barlow`, all fixed before the doc page existed.**
  - **Five real, wrong utility classes**, same failure mode as `tree-view`'s `bg-border-secondary`
    earlier this build - a class that looks plausible for a vanilla Untitled UI Tailwind setup but
    was never added to this repo's own hand-curated `@utility`/`--ui-*` layer, so it silently
    compiled to nothing: `bg-brand-primary_alt` (selected `button-brand` background - fixed to
    `bg-brand-secondary`, the real pale-brand-tint token, same one `FeaturedIcon`'s `light` theme
    uses), `text-fg-secondary_hover` (icon hover colour on 3 of the 5 types - fixed to
    `text-fg-quaternary_hover`, the real token, matching the same default-`text-fg-quaternary` /
    hover-`text-fg-quaternary_hover` pairing this same component already used correctly, and that
    `Button` uses too), `bg-secondary_alt` (the `button-border`/`button-minimal` tab-list track
    background - fixed to `bg-secondary`), and `bg-border-secondary` (the `underline` type's
    bottom separator line, the exact same bug as `tree-view`'s connector line - fixed to
    `bg-[var(--ui-border-secondary)]`). One was a straight typo rather than a missing token:
    `border-fg-brand-primary_alt` (the `underline`/`line` active-indicator colour) - `--color-fg-
    brand-primary_alt` doesn't exist, but `--color-fg-brand-secondary_alt` does (a real `@theme`
    colour, confirmed via grep, not assumed) and is obviously what was meant - fixed to
    `border-fg-brand-secondary_alt`.
  - **`group-orientation-vertical:justify-start` was never a real variant** - no
    `@custom-variant orientation-vertical` (or similar) exists anywhere in `app/globals.css`, so
    vertical tabs' icon+label never left-aligned. React Aria's `Tabs`/`TabList` already sets a real
    `data-orientation` attribute (confirmed in `node_modules/react-aria-components/dist/private/
    Tabs.js`), so this needed no new custom-variant at all - fixed to Tailwind's built-in
    `group-data-[orientation=vertical]:justify-start`, which reads that same attribute directly.
  - **No `font-barlow` on the `Tabs` root** - the same gap every ingest this build has shipped
    with at least once (Modal, TreeView, Select family, Toggle, `DateRangeControl`, both `Table`s,
    `Dropdown`). Fixed on `Tabs`' own root className; nothing here is portaled, so one fix covers
    the whole family (`TabList`/`Tab`/`TabPanel` all inherit it).
  - All six caught by grepping every class in the new file against `app/globals.css` and checking
    each theme-colour claim (`--color-fg-brand-secondary_alt` etc.) directly, before ever loading
    the component in a browser - confirmed with a live Playwright pass after, cycling every one of
    the 5 horizontal and 5 vertical types plus every other control with zero console/page errors,
    per the QA check's "live browser render, not just a code read" item.
  - Doc page built at `app/(docs)/components/tabs/page.tsx` following the established
    config-driven template (`config/design-system.config.ts`'s `tabs` entry, `ContextualConfigPanel`,
    Playground + Types + Sizes + Full width + API + Usage + Figma) - the fuller version of the
    template, matching `radio-buttons`/`radio-groups`/`select`, not the lighter static-page version
    `table`/`dropdown`/`modal` shipped with (a real inconsistency across this build worth noting:
    those three have no `design-system.config.ts` entry and no live variant-hiding, unlike every
    other documented component). Slotted alphabetically in both `lib/nav.ts` and
    `design-system.config.ts` (between `select`/`table` and `toast`). No Figma frame provided this
    time - shipped with an honest "not linked yet" section rather than a fabricated link.
- **First `components/marketing/**` ingest (`faq/faq-accordion-01.tsx`) - a new, fourth component
  tier alongside `base`/`application`/`custom`, for pre-built landing-page sections rather than
  atomic controls.** Ran the same QA check as any other ingest before docs were written:
  - **Same recurring gaps as every other ingest this build** - no `font-barlow` on the section root
    (fixed), and three uses of `text-md`, the sitewide-dead utility (see the `tabs` entry above) -
    fixed to `text-base` for body copy (the question answers, the CTA subtext's base size) and
    `text-lg` for the question label specifically, since it reads as a small heading, not body text
    - not a blanket find-replace, the two call for different real sizes.
  - **Two real lint findings, both pre-existing in the generated file** - a ternary used purely for
    its `Set.add`/`delete` side effects (`@typescript-eslint/no-unused-expressions` warning, fixed
    to a real `if`/`else`) and an unescaped `'` in two spots of static JSX text (`react/no-
    unescaped-entities`, same class of issue as the `table` doc page's own ingest).
  - **`AvatarCount` wired in as asked, honestly scoped to what it actually renders.** The component
    itself (`components/base/avatar/base-components/avatar-count.tsx`) is a small absolute-
    positioned corner badge (`size-3.5`, red) - a notification-style indicator, not a "+N more
    people" overflow avatar, confirmed by reading its own source before using it. It was already
    wired into `Avatar` itself (via the `count` prop, done at the original Avatar ingest) but never
    exercised anywhere in this new file. Added `count={3}` to the last avatar in the "Still have
    questions?" stack, documented in both an inline comment and the doc page's Composition section
    as "3 new replies," not a headcount - using the real component for what it actually is rather
    than bending it to look like a different, unbuilt pattern (a "+N" overflow avatar would need a
    different component entirely).
  - **Correction, same session: the expand/collapse mechanism itself doesn't belong owned by one
    marketing section - extracted into `components/base/accordion/accordion.tsx`, a real, generic
    `Accordion` component (`items`/`defaultOpenKeys`/`singleOpen`/`className`), and
    `faq-accordion-01.tsx` now composes it instead of hand-rolling its own `useState`+toggle+chevron
    SVG+`motion.div` inline.** Caught directly by the user right after the first pass shipped -
    "wire up AvatarCount" had been read as "make the whole FAQ section work," when the actual ask
    was narrower (just the avatar dependency) plus a separate, bigger one: the *accordion pattern*
    itself needed to graduate to a real, independently reusable component, the same as `Tabs`/
    `Table`/`Dropdown` did this build, not stay trapped inside one marketing section's file. Given
    the real, question/answer, this is a `base` component (composes nothing else) - the FAQ section
    became its first real consumer, `AccordionItemType[]` mapped from the same FAQ data, dropping
    the unused per-item `icon` field the generated file carried but never rendered.
  - **Slotted as a full `Components` entry, not the lighter Custom-Components/Marketing template** -
    unlike the marketing section around it, the extracted `Accordion` *does* take real configurable
    props (`items`, `singleOpen`), so it gets the full config-driven doc page (a new `accordion` key
    in `design-system.config.ts`, `ContextualConfigPanel`, a live Playground). Slotted alphabetically
    first in both `lib/nav.ts`'s `Components` array and `design-system.config.ts` (before `alert`).
    The marketing FAQ page's own Composition section and "What lives here" copy were updated to
    match - it no longer claims "there's no shipped DEW Accordion primitive," it links to the real
    one and documents that it's the consumer, not the source, of the interaction.
  - Verified `tsc`/`lint` clean and a live Playwright pass on *both* pages post-refactor - the FAQ
    section still expands/collapses and still renders the count badge, the new component page's
    Playground toggles `singleOpen` correctly (closes the previously-open item), zero console errors
    either page.
- **`table` re-audited against a wider Figma reference (node 1:84599, the full assembled table
  examples - Team members, Sales, Companies, Files) - one real component built, one real
  demonstration gap closed, four separate pieces of work logged rather than built speculatively.**
  - **Every single example in that frame ships pagination - `TableCard` had none at all.** Not a
    style mismatch, a missing piece of the component family. Added `TableCard.Pagination`
    (`page`/`pageCount`/`onPageChange`) - the simple "Page X of Y" + Previous/Next footer, matching
    the dedicated Pagination symbol Figma documents as its own component (node 1:85470). The
    richer numbered variant the Sales example shows (1 2 3 … 8 9 10, a rows-per-page select, "1-50
    of 250") is a bigger, separate component - logged in the doc page's Figma section, not built.
  - **`BadgeWithIcon` already existed and was already correct - it had just never been shown in a
    table context.** The Sales example's Status column (Paid/Refunded/Cancelled) uses an icon
    inside the pill, not a dot - a materially different real `Badge` variant from the dot-based
    Active/Inactive treatment the Team members example (and this page's own demo) already used.
    Added a "Status badges" section demonstrating both side by side, framed correctly: picking the
    wrong one for the context is the mismatch to guard against, not a missing component - `Badge`
    already ships both.
  - **Four more gaps found via the Companies/Files examples, each logged, none built:** a filters
    bar (segmented tabs + search input + a Filters button - achievable today by composing `Tabs`/
    `Input`/`Button`, not a new bespoke component), an avatar-group cell (stacked avatars + "+N"
    overflow - `AvatarLabelGroup` is one avatar plus a title/subtitle, not this shape), a
    progress-bar cell (no DEW progress bar exists), and a file-type-icon cell (would need a small
    icon set that doesn't exist yet). Each is real, each is a separate piece of work bigger than a
    style fix - the same "log it, don't build it speculatively or drop it silently" call as the
    `table` entry above made for "Action icons"/"Action buttons".
  - Verified `tsc`/`lint` clean and a live Playwright pass - `TableCard.Pagination` correctly
    advances the page number and disables `Previous`/`Next` at the boundaries, zero console errors.
- **Follow-up `table` variables/style QA, requested directly - one more real dead class found by
  checking every remaining class against the compiled CSS rather than trusting the source.**
  `focus-visible:ring-offset-bg-primary` (on `Table.Head` in both `base/table/table.tsx` and
  `application/table/table.tsx`) doesn't compile to anything - `ring-offset-*` expects a bare
  colour token, not another utility's name like `bg-primary`, and this repo defines no
  `ring-offset-*` colour utility at all (confirmed via the compiled CSS, not just source grep -
  neither `app/globals.css` nor its output define one). Also confirmed harmless-but-dead twice
  over: no `ring-offset-{width}` utility is set alongside it either, so even a working colour
  would render with 0px offset. Removed from both files rather than inventing a new token nothing
  else in this codebase uses.
- **`components/marketing/faq/faq-accordion-01.tsx`'s Accordion titles weren't pulling correct
  typography - same `.prose-doc h3` leak as `TableCardHeader`'s `.prose-doc h2` leak earlier,
  caught the same way (flagged directly by the user off the rendered page, then confirmed via
  computed style, not assumed).** `Accordion` wraps each title in a literal `<h3>`
  (`components/base/accordion/accordion.tsx`) - `.prose-doc h3` sets uppercase, `0.08em`
  letter-spacing, and 32px/8px top/bottom margin, applying to any `<h3>` at any depth inside
  `.prose-doc`, not just the docs prose's own headings. Tailwind's preflight already resets
  `text-transform` on every element (so the uppercase never actually showed), but nothing reset
  `letter-spacing` or the h3's own margin - measured `0.96px` letter-spacing and `32px` top margin
  on the title before the fix, `normal`/`0px` after. Fixed with the same `!`-override pattern:
  `m-0!` on the `h3`, `tracking-normal!` (plus `normal-case!` for defence-in-depth even though
  preflight already covers it) added to the title span's existing `text-lg! font-semibold!
  text-primary!`.
- **First `components/application/section-headers/section-headers.tsx` ingest - a compound
  `SectionHeader.Root/Group/Heading/Subheading/Actions`, replacing a title+border-b pattern that
  had been hand-rolled independently in 4+ different `/pages/**` files (confirmed by grepping for
  the repeated `text-2xl font-medium text-primary` heading class across `app/pages/**` - not
  guessed from memory).** Ran the same QA check as every other ingest before docs were written:
  - **Same two recurring gaps as every ingest this build** - no `font-barlow` on the root (fixed),
    and `text-md` on `Heading`, the sitewide-dead utility (fixed to `text-lg`, matching every other
    "small heading" fix this session - `TableCardHeader`, `Accordion`).
  - **`Heading` renders a literal `<h2>` - same `.prose-doc h2` leak as `TableCardHeader`, fixed
    the same way before it ever shipped** (`m-0! text-lg! font-semibold! tracking-normal!
    text-primary!`) rather than waiting for a screenshot to catch it, per the QA check's own point
    about checking this on sight for every new component with a bare heading tag now that it's a
    known, recurring failure mode in this codebase.
  - **Replaced the hand-rolled version in 4 files**: `app/pages/_shared/project-list-content.tsx`,
    `app/pages/_shared/data-overview.tsx`, `app/pages/dashboard/option-2/data-overview.tsx`, and
    `app/pages/project-list/option-2/page.tsx`. Each preserved its own padding/background override
    (`p-6`, `px-9 py-6`, `bg-secondary px-9 pt-8`) via `className` rather than forcing identical
    spacing everywhere - only the title/subheading/actions structure itself was unified. One,
    `project-list/option-2`, previously had no bottom border at all (a `bg-secondary` wash instead)
    - adopting the real component's border is a deliberate, small visual change that comes with
    "replace the hand-rolled version," not an oversight.
  - Slotted alphabetically in `lib/nav.ts` and `design-system.config.ts` as `section-headers`
    (between `radio-groups` and `select`). Config-driven doc page (Playground + a trailing-info
    variant + API + Usage + "Where it's used" + Figma), matching the full template `tabs`/
    `radio-buttons` use, not the lighter one - like `Accordion`, this takes real props worth a live
    Playground.
  - Verified `tsc`/`lint` clean and a live Playwright pass across the component page and all 6
    `/pages/**` routes that render one of the 4 edited files (including the 2 left untouched to
    confirm nothing broke by association) - zero console errors anywhere, computed style confirmed
    `font-barlow`/`m-0`/`letter-spacing: normal` on the heading.
- **Removed the "Marketing" nav section (`lib/nav.ts`) and its one "FAQ accordion" entry, per direct
  user feedback ("Remove. Now redundant.") off a screenshot of the sidebar.** The page itself
  (`app/(docs)/marketing/faq-accordion/page.tsx`) and the `FAQAccordion01` component are untouched -
  `Accordion`'s own "Where it's used" note still links to it as a real usage example, it's just no
  longer a separate, prominent nav destination now that `Accordion` has its own first-class
  `Components` entry. Reachable by direct URL only, same convention already used for `/pages/*` and
  `/test-*` screens.
- **First `components/base/progress-indicators/**` ingest - `progress-indicators.tsx`
  (`ProgressBarBase`/`ProgressBar`, linear) and `progress-circles.tsx` (`ProgressBarCircle`/
  `ProgressBarHalfCircle`) - documented together under one "Progress" page, per the user's request,
  since they're the same concept (a value/min/max indicator) in two shapes, not two components.**
  Ran the full QA check before docs were written:
  - **`bg-quaternary` doesn't exist - the exact "plausible-for-vanilla-Tailwind, not in this repo's
    curated set" failure mode this whole build keeps hitting.** `text-quaternary` is real; a
    background version isn't. Confirmed via the compiled CSS (0 hits), not source alone. Used in
    three places, same bug each time: `ProgressBarBase`'s track (fixed to `bg-tertiary`, the same
    token `Toggle`'s track uses for the identical "unfilled state" role) and both progress
    circles' background `<circle>` stroke, `stroke-bg-quaternary` (fixed to `stroke-[var(--ui-bg-
    tertiary)]` - `--ui-bg-tertiary` is scoped to background-only use, the same "no generic
    `stroke-*` utility exists in this repo, reference the real CSS variable directly rather than
    inventing a new global one for a single internal use" call as `tree-view`'s connector line and
    `table`'s underline separator earlier this build). Before the fix: progress track backgrounds
    and circle background rings were fully transparent, invisible against most surfaces - confirmed
    via computed style (`rgba(0,0,0,0)` before, a real `rgb(242,242,241)` after) not just guessed.
  - **No `font-barlow` anywhere in either file** - same gap every ingest this build has shipped
    with at least once. `ProgressBarBase` needed it on its own root; `ProgressBar` needed it on
    each of its 4 separate `labelPosition` wrapper divs individually (its label text is a sibling
    of `ProgressBarBase`, not a descendant of it, so fixing only the base component wouldn't have
    cascaded to the label).
  - **`stroke-fg-brand-primary`/`bg-fg-brand-primary` (the filled portion of both shapes) were
    already correct** - confirmed via the compiled CSS (1 hit each) before assuming they needed the
    same fix as their neighbours; `--color-fg-brand-primary` is a real, unscoped `@theme` colour
    (documented directly in `app/globals.css`'s own comment), so Tailwind generates every `bg-`/
    `text-`/`border-`/`stroke-` variant of it automatically. Not every "fg-" or "bg-" prefixed class
    in a CLI-generated file is broken - each one gets checked on its own, not assumed guilty by
    association with a broken neighbour.
  - Slotted alphabetically as `progress` in both `lib/nav.ts` and `design-system.config.ts`
    (between `modal` and `radio-buttons`). Full config-driven doc page (Playground with a Linear/
    Circle/Half-circle type switch, static Linear/Circle/Half-circle reference sections, two API
    tables, Usage, Figma) - real configurable props across 4 components, same tier as `tabs`/
    `radio-buttons`, not the lighter template.
  - Verified `tsc`/`lint` clean and a live Playwright pass - cycled all three types in the
    Playground, incremented the value, checked the actual computed `background-color`/`stroke` (not
    assumed from the className) on both the linear track and a circle's background ring, zero
    console errors.
- **`Tag` label text switched to uppercase/semibold and re-centred, per direct user request
  ("change all tags text decoration to UPPERCASE and font style to Barlow SemiBold... remove
  vertical trim... so the text properly sits in the centre of the pill").**
  `components/base/tags/tags.tsx`'s `styles` object (sm/md/lg) previously set `font-medium` with no
  case transform - added `uppercase tracking-wide font-semibold` to each size's `root.base` and
  `count` fragments (count is numerals only, so `uppercase` is a no-op there, but the weight change
  was applied for consistency). `font-barlow` was already present on `Tag`'s root, untouched.
  - **"Vertical trim" diagnosed as Tailwind's default `text-xs`/`text-sm` line-height (1rem/1.25rem)
    sitting taller than the glyph itself, so the pill's `py-*` padding wasn't the only thing
    governing vertical position - the leftover leading was.** Fixed by adding `leading-none` to
    both the label and count fragments; the pill's own padding now does 100% of the centring.
    Confirmed via computed style on a live instance (not just eyeballed): 3px/3px top/bottom gap
    between the pill's border box and the text's bounding box, identical on both sides, before this
    fix the gap was asymmetric.
  - **Scoped "all instances across both options 1 and 2"**: grepped every `/pages/**` route for
    `Tag`/`TagGroup`/`TagList` - none render it directly. `Tag` is only ever reached through
    `InputTagsOuter`/`InputTags` (`components/base/input/input-tags*.tsx`), which are demonstrated
    solely in the `/components/input` doc page's "Tag input" section (no `/pages/**` route uses the
    tag-input variant of `Input` yet). The fix still "flows to all instances" - there's just
    currently only the one call site - rather than there being a hidden second consumer that needed
    separate edits.
  - `tag-checkbox.tsx`/`tag-close-x.tsx` (Tag's icon-only sub-components) checked and left alone -
    no rendered text in either, nothing to transform.
  - Tags has no dedicated nav entry/doc page of its own - it's documented as part of `Input`'s "Tag
    input" feature section, so no `lib/nav.ts`/`design-system.config.ts` changes were needed.
  - Verified `tsc`/`lint` clean and a live Playwright pass on `/components/input`'s Tag input
    section - computed style confirmed `text-transform: uppercase`, `font-weight: 600`, and
    symmetric vertical centring on a real rendered tag, zero console errors.
- **Correction to the above: the pill labels the user was actually pointing at
  ("Awaiting review", "Under review", "Active", "Completed" on the dashboard) are `Badge`
  instances, not `Tag`.** Flagged directly by the user off a screenshot of `dashboard/option-1`/
  `option-2` after the `Tag` fix landed and visibly changed nothing there - `Tag` genuinely isn't
  rendered on any `/pages/**` route (confirmed by grep before the first pass), so "tags" in the
  request meant the colloquial/status-pill sense, not the literal `Tag` component. Applied the same
  three changes to `components/base/badges/badges.tsx` instead: every size fragment across all six
  text-bearing badge variants (`Badge`, `BadgeWithDot`, `BadgeWithIcon`, `BadgeWithFlag`,
  `BadgeWithImage`, `BadgeWithButton` - `BadgeIcon` and `CountBadge` deliberately excluded, no
  transformable text) went from `font-medium` to `font-semibold uppercase tracking-wide
  leading-none` (31 occurrences, one `sed` pass). `font-barlow` was already present on every
  variant's `common` className.
  - **Incidentally surfaced and fixed `text-md` - the same sitewide-dead utility as this build's
    other `text-md` finds - used for every variant's `lg` size (12 occurrences).** `--text-md` was
    never defined (only `--text-display-*` are custom; `xs`/`sm`/`base`/`lg`/`xl` come from
    Tailwind's built-in scale, which has no `md` step) - confirmed the same way as the earlier
    `text-md` finding, by checking the compiled CSS, not source. Fixed to `text-base`, one step up
    from `md`'s `text-sm`, matching the "body text → `text-base`" convention already established
    for this dead class. Before the fix, every `lg` badge silently fell back to an inherited
    font-size instead of its intended one - not something you'd notice without checking computed
    style, since the class name still reads as plausible.
  - Verified `tsc`/`lint` clean and a live Playwright pass across `dashboard/option-1`,
    `dashboard/option-2`, and the full `/components/badge` doc page (every type/colour/size/dot/
    icon/dismiss/group section) - all render uppercase and semibold with no overflow or clipping
    from the `lg` size's corrected font size, zero console errors.
