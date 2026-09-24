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
- **Every collection/list screen is Section header, then search, then table - non-negotiable.**
  `SectionHeader.Root/Group/Heading/Subheading/Actions` (title, a real `CountBadge`, a subheading,
  the primary create action) first, then a real `Input` search field, then `TableCard.Root` wrapping
  `Table` with real `TableCard.PaginationNumbered` - never a hand-rolled header, never a bare
  unpaginated table. `app/pages/_shared/dsa/dsa-list.tsx` and `app/pages/_shared/dla/dla-list.tsx`
  are the canonical reference - both already match this exactly. Caught twice in one pass, both
  directly by the user: `/proto/collection-sidebar`'s own column 3 had hand-rolled its own `<h1>` +
  `CountBadge` header and a bare, unpaginated `Table` instead of pulling in the real components -
  fixed by deleting the reimplementation and rendering the real `DsaListContent`/`DlaListContent`
  directly, not a lookalike. The same sweep found `app/pages/_shared/project-list-content.tsx` -
  a real, live, shared production screen - missing the search step entirely; fixed the same
  session. Check this on sight any time a collection/list screen is touched, the same way a
  `font-barlow` gap or a dead utility class gets checked on every new component.
  - **Applies at whatever scale the table actually is, confirmed directly by the user rather than
    left as an exemption.** A first pass read a small table embedded inside a record's own detail/
    tabbed content - `dsa-detail.tsx`'s "Systems that receive data through the API" table and
    `observation-detail/page.tsx`'s `MeasurementsTable` - as a different, smaller pattern exempt
    from this contract. Asked directly; the answer was no, they follow it too. Both fixed: `dsa-
    detail.tsx`'s Systems table gained a `CountBadge` next to its own label, a real search `Input`,
    and real `TableCard.PaginationNumbered` (still no page-level `SectionHeader` - that component
    is sized for a whole screen, not a sub-card inside a tab, so the count+label pairing stands in
    for it at this scale). `observation-detail/page.tsx`'s `MeasurementsTable` was rebuilt on the
    real `TableCard`/`Table` (it had been on the bare `components/base/table/table.tsx` primitive -
    the exact "wrong table component" bug this whole contract exists to catch) with real numbered
    pagination; its own wrapping `<div>` had a redundant `border`/`rounded-lg` that doubled up
    against `TableCard.Root`'s own `ring-1`/`rounded-xl` chrome once the real component was in
    place - removed. One search box was deliberately left out: `MeasurementsTable` renders as the
    *value* of a single "Measurements" field in a label/value row, not its own labeled section, and
    a search field doesn't fit that slot honestly - flagged here rather than forced in silently.
    The takeaway for the next screen this comes up on: don't assume a table's context makes it
    exempt - ask, the way this one did, rather than deciding unilaterally either way.
  - **Two known items deliberately left alone, both confirmed directly:** `app/pages/dashboard/
    option-2/data-overview.tsx`'s `ProjectsTable` and `app/pages/project-list/option-2/page.tsx`
    stay untouched - both sit inside the `option-2` top-nav shell this file already documents
    elsewhere as "an inert reference, not a maintained parallel surface," and that precedent holds
    here too. `app/pages/projects/page.tsx` and `app/pages/projectsv2/page.tsx` - both render a
    table with neither a `SectionHeader` nor search, aren't linked from anywhere in the app, and
    aren't otherwise documented in this file - are confirmed stale/superseded drafts, safe to leave
    as-is; not brought in line with this contract and not deleted either, since deletion wasn't
    asked for.
- **Figma is the source of truth wherever a frame exists.** No colour, spacing, or state was
  invented or left un-checked against Figma when a reference frame was available. See below.
- **A lo-fi/wireframe is a starting point, never the literal layout to ship.** Whether it's a
  Figma wireframe or a plain screenshot, its job is to establish the content and the flow - what
  fields exist, what a screen needs to say, what actions are possible - not to dictate the exact
  chrome, stepper widget, or panel arrangement pixel-for-pixel. That content always gets re-fitted
  into this system's real three-column shell and real components, following whatever pattern
  already exists for the closest analogous screen (see "List -> deep dive" below), even where that
  means restructuring the wireframe's own layout outright - a numbered-circle stepper becomes the
  same `Tabs`-with-error-count pattern every other multi-step form here already uses, a flat two-
  pane screen becomes a real list + deep dive, an inline flat scroll becomes tiered per the
  cognitive-load principles below. This is the same "Figma wins on styling, never on scope or
  structure" instinct the Generated-screens/Exploratory-page-layouts sections already apply to
  hi-fi frames, made explicit for lo-fi ones too, because a lo-fi wireframe is even less likely to
  already reflect this system's real information architecture than a hi-fi one is. Two worked
  examples: the Data Sharing Agreement (DSA) build (its lo-fi's flat form became three real tabs,
  its own two-pane screen became a real list -> deep dive) and the Data Licencing Agreement (DLA)
  build below (its numbered stepper became the same Tabs pattern, its "Add a Location" methods were
  re-derived from Explore's own real map-search components instead of rebuilt from the wireframe's
  own drag-and-drop chrome). Ask when a wireframe's intent is ambiguous; never ship its layout
  verbatim on the assumption that "the wireframe already decided this."
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
- **No two icons side by side representing one label or concept.** Pick the one icon that names
  the actual thing - a second icon glued next to it reads as clutter, not information, especially
  when nothing (spacing, a divider, a different weight) tells the eye they mean different things.
  Caught on `/proto/public-user-explorations`'s "Log an observation" hook: a `Lock01` (signalling
  "this is gated") sat directly next to a `Camera01` (signalling the action) with no separation -
  the CTA button next to it already says "Create a free account," so the lock was redundant. Fixed
  to the one icon that names the action itself. Applies everywhere, not just that proto.
- **The shell's header spans the full width, above the icon rail + sidebar + main row - never
  nested inside `main`, and never a sibling only of `main` instead of the whole row.** Every real
  shell (`dashboard/page.tsx` and its siblings - see "Build hierarchy" below) renders `<header>`
  as its own top-level sibling, directly inside the page's root column, *before* the
  `<div className="flex flex-1 overflow-hidden">` that holds the icon rail/contextual sidebar/main
  content:
  ```
  <div className="flex h-screen flex-col ...">
    <header>...</header>                          <- full width, spans everything below it
    <div className="flex flex-1 overflow-hidden">
      {iconRail}
      <aside>...</aside>
      <main>...</main>
    </div>
  </div>
  ```
  Putting `<header>` inside `main` (or anywhere inside that inner row) makes it only span
  whatever's to its right instead of the full screen - easy to miss when a page has no sidebar yet
  (nothing sits to the header's left to expose the bug), and it breaks the moment one gets added.
  Caught twice on `/proto/public-user-explorations`: flagged directly by the user once a column-2
  sidebar was introduced and the header suddenly started rendering after it instead of above it -
  "the shell is a non-negotiable contract you've violated." Check this on sight on any new or
  edited page shell, not just when a sidebar is visibly broken by it.
- **Three columns on every screen, for every persona: primary icon rail, contextual sidebar, main - under a
  full-width header.** A role that can't use a section still gets all three, with the restriction stated in main
  (`DsaShell` does this); a screen is never rebuilt as two columns because its content is thin or its persona is
  limited. Column 2 always exists and always says something about where you are. `dashboard/page.tsx` and
  `project-list/page.tsx` render `public-user`'s Home and Projects with `GuestAboutAside` as column 2 (Sept 22 2026
  fold-in of `/proto/public-user`'s "Reference" variant - see that entry below) - this contract is now met for every
  built role. See "List -> deep dive" below.
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
  `app/pages/dashboard/page.tsx` as the template for a new `/pages/<page-name>` or
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
  section's real `/pages/<key>` route; if not (already on the right page, or the section
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
  above for the real nav tree this reads. (Superseded in part: the no-`<aside>` and hidden-header-actions
  points below were reversed or revised by the Sept 21 2026 entries at the end of this file.)** Each shell (`dashboard/option-1`, `project-list/
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
  `app/pages/dashboard/page.tsx` does - it needs to look like a real screen, not a doc
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

## Build hierarchy: components -> shell -> screens -> flows

Four distinct layers, each built from the one below it - stated explicitly so a new screen coming
in from Figma always gets built in this order, not assembled ad hoc:

1. **Components (`components/base/**`, `components/application/**`)** - the DEW layer, ingested
   once via the "New component workflow" above, styled entirely through `--ui-*` tokens. Never
   patched to serve one screen's specific need - see "DEW vs. Scaffold."
2. **Shell** - the persistent chrome a role's screens share: primary icon rail + contextual
   sidebar (side nav), plus the header bar above it. Built from real components (step 1) and
   token-based structural chrome for the nav-specific parts per "Exploratory page layouts"'s
   nav-chrome exemption. As of the Sept 16 2026 layout decision, the sidebar shell is the one real
   direction - documented live, in code, at `/patterns/navigation` (side nav + top nav anatomy;
   the top-nav shell is kept there only as the sunset alternative for the record, not a live
   option). `dashboard`, `project-list`, `project-detail`, `observation-detail`, and
   `observations` already share this one shell - a new screen borrows it too, it
   does not get its own.
3. **Screen (`app/pages/<page-name>/page.tsx`)** - the shell plus that page's own real content.
   Every *contained* widget inside a screen's content still has to be real DEW or an honest `?`
   gap (see "Generated screens" and "Exploratory page layouts" above) - only the shell itself is
   exempt from pixel-fidelity, and only until it's decided, which it now is for the sidebar shell.
   Bringing a new screen in from Figma means: borrow the shell first (check `/patterns/navigation`
   and the existing shells above before drawing any new chrome), then map the screen's own content
   against the component library the same way any `/pages/*` work does - never design a new shell
   per screen.
4. **Flow** - a sequence of screens a role actually moves through to complete one real task (e.g.
   a registered user's dashboard -> project-list -> project-detail -> observation-detail). Screens
   are reviewed individually against the checks above, but a flow is the unit that actually gets
   user-tested - a screen can pass every check in isolation and still fail as part of a flow (a
   broken back-button, lost filter state on return, a dead end with no path onward). Any usability
   pass or stakeholder walkthrough should be scoped to a flow, not a single screen.

## List -> deep dive (the collection pattern)

How any collection of records is built in a `/pages/*` shell. Established by Projects (`project-list` ->
`project-detail`), made explicit when the Data Sharing Agreement (DSA) workflow was built to match it
(`/pages/dsa` -> `/pages/dsa/<id>`, Sept 22 2026). A new collection - agreements, datasets, users, vouchers - follows this
unless a decision here is overridden by the user.

1. **The list is a table page.** One click on the nav section lands on a table of the collection. Column 2 (contextual
   sidebar) chooses a view of it - Projects/Datasets, or DSA's Active / Inactive / Revoked / Drafts with counts - and main
   is a `SectionHeader` (title, a count badge, the primary create action) over a `TableCard` with
   `TableCard.PaginationNumbered`. The view lives in the URL (`?status=`) so back/forward and links work. Don't add a
   column that repeats what column 2 already filtered on (no Status column inside a status bucket).
2. **A row is a link, not a button.** Whole-row `href` through `useRoleHref` to the deep dive. No per-row "View" button
   unless a row has more than one destination.
3. **The deep dive is its own route** with its own URL: `/pages/<name>/<id>`. Main opens with a "Back to <collection>"
   link (`link-gray`, `ArrowNarrowLeft`), then the ID, a status `Badge`, and the primary actions (Download, an Actions
   menu). The breadcrumb is Home / section (now a link back to the list) / the ID. Column 2 stays useful: project-detail
   shows its records tree, DSA keeps the status buckets with the record's own bucket highlighted.
4. **Create and edit are routes too,** in the same shell: `/pages/<name>/new` and `/pages/<name>/<id>/edit`. Saving lands
   on the record's deep dive, Back returns to where you came from and asks before discarding changes. Destructive actions
   (revoke, delete) are confirmed in a `DestructiveModal` and stay on the page, so the record's new state is visible.
5. **Three columns on every route and every persona** (see Final check). A restricted role sees the shell with the
   restriction in main.
6. **Deep-dive content is tiered,** per the cognitive-load principles: cards or tabs by concern, a `?` marker for a
   missing component, "Not provided" instead of a stray dash, a section collapsing to one honest line when unused.
7. **Every internal link carries the role.** `useRoleHref` now appends `&userRole=` to a path that already has a query,
   so `?status=` links keep the persona.
8. **No backend, so shared state is a module store.** When list, deep dive and form are separate routes they must read the
   same records: `app/pages/_shared/dsa/dsa-store.ts` (`useSyncExternalStore`, seeded, server snapshot = the seed) is the
   template. A client navigation keeps the edits, a full reload resets them, and a deep dive for a record that no longer
   exists shows an honest "not found" state, not a blank page.
9. **One shell component per collection,** not a pasted copy per route: `DsaShell` (`app/pages/_shared/dsa/dsa-shell.tsx`)
   owns header, rail, column 2 and the restricted state, and the list, deep dive, `new` and `edit` routes only supply
   main. The older shells (dashboard, project-list, project-detail, observation-detail, observations) still each paste
   their own; folding them onto a shared shell is separate work.

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

### Data model ingestion research (`/proto/data-model-stress-test`, `/config/data-model`)

A real, working CSV/JSON/XLS/XLSX ingestion stress-test tool (`/proto/data-model-stress-test`) and
a companion transparency page (`/config/data-model`) were built to validate the corrected Event/
Occurrence/Observation model above against actual BDBSA legacy exports (real Site/Visit/Species
Fauna/Species Flora files, survey SU1211) - not just the Figma wireframes the field schema was
originally pulled from. `config/data-model-schema.ts` is the single source of truth both pages read
from - the real per-type field schema (`FIELD_SCHEMA`), the BDBSA-key crosswalk
(`BDBSA_KEY_CROSSWALK`), and the full, current gap list (`KNOWN_GAPS`, with a persisted per-field
"Verified" checkbox on `/config/data-model`) all live there, not duplicated here - **`/config/
data-model` is the canonical place to read the up-to-date gap list, not this file.**

- **Confirmed hierarchy: Project → Site → Visit → Observation - Site and Visit are both real,
  distinct levels.** Directly confirmed with the user after a live scoping question, since
  "observations roll into visits, visits roll into Project (or Survey)" genuinely read two ways
  (skip Site, or just describe the roll-up loosely). It does not skip Site.
- **Project has a real `id`: the Survey Number.** Every row of a real BDBSA export - Site, Visit,
  and Species alike - carries the same Survey Number; it's the one identifier that ties the whole
  hierarchy together, confirmed directly by the user and traced across real rows. Not a per-node
  field - a project-level structural column, same tier as Kind/Type/ID/Parent ID.
- **A real legacy export has no ID-based relationships at all - and the sandbox now derives them
  anyway.** Occurrence → Visit → Site is joined by a composite natural key (Survey Number +
  Zone/Easting/Northing to find the Site, then the Occurrence's own date column matched against
  that Site's visit date) - confirmed by tracing real rows across all 4 files, not assumed.
  `resolveNaturalKeyRelationships` in `/proto/data-model-stress-test` simulates that same traceback
  automatically: real Site/Visit/Occurrence rows get a synthetic ID where the source has none (Site
  from CAMPMAP-QUADSITE-PATCHQUAD or its own coordinates; Occurrence/Observation from the row's NSX
  species code + row number, see the classification entry below), then a derived Parent ID via the
  coordinate+date match, never overriding an explicit one already present. Verified against all 4
  real BDBSA files uploaded together: every record resolves correctly, Project id `1211` down
  through 14 Sites, 14 Visits, 837 Occurrences, and 837 Observations (1702 total records once every
  species row is split into its Occurrence/Observation pair - see below). A record whose Kind is
  known but whose Type isn't is still placed correctly in the Resolved tree - `unresolved` in
  `app/proto/data-model-stress-test/page.tsx` is deliberately keyed off Kind/Parent-shape validity
  only, not Type, since real placement doesn't depend on knowing the exact subtype.
- **Occurrence is a real tree level between Visit and Observation - "each row on the species CSVs
  are occurrences," per the user directly.** Not just a label: `expandSpeciesOccurrences` in
  `/proto/data-model-stress-test` splits every unclassified species row into two records before the
  rest of the pipeline ever runs - an Occurrence (the real-world "this species was recorded here")
  with exactly one Observation child (the ecological detail captured for it). This refines the
  earlier "Occurrences/Observations are always leaves" model rule - an Observation is still always
  a leaf, but an Occurrence may now parent exactly one thing, its own Observation, and nothing else.
  Scoped to this ingestion sandbox for now; the live product trees (`project-detail/option-1`,
  `observation-detail/option-1`) still show Occurrence as a leaf and haven't been revisited against
  this - see the `project_projects_data_model` memory.
- **Which Observation scaffold applies is now derivable, not a fabricated guess - closing the "No
  explicit Observation-type discriminator in real data" gap.** `classifySpeciesRow`
  (`config/data-model-schema.ts`) reads two real columns already on every species row - Taxonomic
  Type (in practice, which file a row came from: SPECIES_FAUNA_*/SPECIES_FLORA_*, since the real
  SPECIESTYPE/"Taxonomic Type" *column* only encodes a narrower group like Bird/Reptile/Plant, not
  literally "Flora"/"Fauna") and Number Observed:
  - Number Observed = "Present but not counted" → Observation:Community, Flora or Fauna alike.
    Originally stated as Flora-only; extended to Fauna once verifying against the real
    SPECIES_FAUNA export turned up the identical value on 4 real Fauna rows - confirmed directly
    with the user rather than silently assumed.
  - Fauna, Number Observed = 1 → Observation:Individual.
  - Fauna, Number Observed > 1 → Observation:Population - confirmed directly against the literal
    wording first suggested ("community observation"): Population is the type this schema actually
    built for a same-species headcount ("Number Observed"/"Cover-Abundance" are Population-only
    fields), Community is a different, whole-patch, multi-species concept.
  Occurrence's own type (Individual/Population) follows the same "one organism vs a group" read,
  independent of which Observation scaffold captures the detail underneath it. Verified against all
  4 real BDBSA files: 310 Individual, 46 Population, and 481 Community observations, 0 unresolved.
  Evidence also still suggests the 4-way Observation type split is a UI-level view over one shared
  species-observation schema, not 4 distinct data schemas: fields scoped Community/Population-only
  here (Crown Extent, DBH, Number Observed, Cover/Abundance) actually appear on every real species
  row regardless of type.
- **Sample/demo data must never self-describe its own bugs.** A deliberately-broken sample record's
  Label (or any other UI-visible field) has to look exactly like a real record would - flagged
  directly by the user off a screenshot: "the records ingested will not have these comments like
  'Quadrat parented under observation'... it's never going to have that. It's just going to be
  QUADRAT AB131 - whatever that might be called." What a broken sample row is actually testing
  belongs in a source-code comment beside it, never in a field the UI renders - applies to any
  future demo/sample data in this codebase, not just this one proto.

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
  now the decided nav tree, not a placeholder to keep gating down speculatively (the Sept 21 2026
  entries at the end of this file revise it: species-first, and this is now `DEFAULT_USER_ROLE`):
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
  Can contribute data, nominate sensitive species, track their own submissions/licensing. Was
  `DEFAULT_USER_ROLE` until Sept 21 2026 (now `public-user`, see the note under "Switched via the
  `userRole` URL search param" below) - reach it with `?userRole=registered-user`. It's the other tier
  in active build focus. No organisation - no org switcher.
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
`"public-user"` if missing or unrecognised - **the starting point of the whole app is the signed-out
visitor, changed from `"registered-user"` on Sept 21 2026; every other persona is reached by an
explicit `?userRole=`**). A page reading it must render the role-dependent
part inside a `<Suspense>` boundary - `useSearchParams` opts a route out of static rendering
otherwise (Next.js build error) - see the `DashboardPage`/`Dashboard` split in
`app/pages/dashboard/page.tsx` for the pattern.

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

- **Sept 16 2026 layout decision: the sidebar (icon-rail + contextual-sidebar) shell is the
  preferred direction, decided directly by the user.** Applies going forward to any future
  `/pages/<page-name>/option-1` vs. `option-2` exploration under "Exploratory page layouts" - default
  to building the option-1 shell as the real direction; option-2 (top-nav) is now the comparison
  point kept for the record, not a coin-flip alternative.
  - **Dashboard specifically was folded into this decision immediately: `app/pages/dashboard/
    option-1/page.tsx` moved to the canonical `app/pages/dashboard/page.tsx` (no more `/option-1`
    suffix), and `dashboard/option-2` was kept in place, untouched, as a record of the explored
    top-nav direction per this codebase's "never delete an explored direction" convention - just no
    longer linked to from anywhere real** (confirmed via grep: nothing outside `option-2`'s own
    files ever linked to it). `lib/registered-user-nav.ts` gained a `keyHref(key)` helper
    (`"dashboard"` -> `/pages/dashboard`, every other key -> `/pages/<key>/option-1`) since Home is
    now the one nav key with a route shape different from every other keyed section - centralised in
    one place rather than special-cased at each of the three sidebar shells' (`project-list/
    option-1`, `project-detail/option-1`, `observation-detail/option-1`) own NavTree/
    SectionPlaceholder/goToSection call sites. `project-list`/`project-detail` are **not** folded -
    per the user directly, "the projects page needs work, so we'll keep tweaking that" - both stay on
    their `/option-1` route for now.
  - **Option-2's dark gradient greeting banner (`bg-gradient-to-b from-brand-900 via-brand-800
    via-[63.942%] to-brand-700`) was brought into option-1 as the shared template for the "Hi, X" +
    KPI-row header**, on both `HomeDashboardContent` (registered-user) and
    `AdminHomeDashboardContent` (biodata-admin) in `app/pages/_shared/home-dashboard.tsx` - the one
    shared source both shells' Home content renders through. `KpiStat` gained an `onDark` prop
    (white text/border-white/20 divider) rather than forking a second component, same "extend, don't
    fork" convention used elsewhere (e.g. `Accordion`'s `openKeys`). Per the user directly, the
    banner does **not** carry action buttons the way option-2's own Figma reference did ("Upload a
    dataset"/"Action 2") - this shell already has "Add project"/"Upload dataset" in its persistent
    page header, so repeating them in the banner would be the exact redundancy already flagged and
    removed elsewhere on this page. "Quick actions" became its own labelled section directly below
    the banner instead (matching option-2's own split), rather than staying folded into the same
    bordered block the greeting used to share.
  - **"Bring over all the features"**, interpreted as functional gaps between the two dashboards
    once ported (not a full visual merge - see "consistent shell" reasoning elsewhere in this file
    for why option-1 keeps its own bordered-card idiom rather than adopting option-2's shadow cards):
    ported option-2's richer "Needs your attention" - a "For you"/per-status filter `Tabs` row (the
    Mobbin-research idea: Deel's "For you today" default + Asana's status tabs) over the flat list
    option-1 had, and its semantic status-colour distinction (`"Under review"` -> `blue`, not the
    same flat `gray` as `"Awaiting review"`) so the list reads by urgency at a glance. Both now live
    once in `home-dashboard.tsx`, so `dashboard/option-2`'s own copies are the only remaining
    fork - acceptable since that page is now an inert reference, not a maintained parallel surface.
  - Every internal link that hardcoded `/pages/dashboard/option-1` was moved to `/pages/dashboard`:
    `components/scaffold/breadcrumb.tsx`'s `HOME_HREF`, the direct breadcrumb "Home" `Link`s in
    `project-detail/option-1` and `observation-detail/option-1`, and `/proto/project-detail`'s icon
    rail (a `/proto` lab's internal link kept working, not a content change to the lab itself).
    Verified live: `curl` confirmed `/pages/dashboard` serves the page and `/pages/dashboard/
    option-1` now 404s while `/pages/dashboard/option-2` is untouched; a Playwright pass clicked
    every "Home" entry point (the icon rail on `project-list/option-1`, the breadcrumb on
    `project-detail/option-1` and `observation-detail/option-1`) and confirmed each lands on
    `/pages/dashboard` with the active `?userRole=` preserved.

- **README.md was a stale, hand-maintained snapshot of `lib/nav.ts`, drifted since Accordion/
  Dropdown/Progress/Section headers/Table/Tabs shipped - regenerated to match, per direct user
  report of "documentation debt."** `lib/nav.ts` itself, the docs homepage (`app/(docs)/page.tsx`,
  already built on `useNav()`), and `/llms.txt` were all already accurate - confirmed by checking
  every nav entry resolves to a real page file and isn't a stub beyond the 4 genuinely-unbuilt
  `/patterns/*` pages (each a literal 4-line "coming soon" placeholder). Only `README.md`'s
  Components table was hand-copied and never updated - missing 6 shipped components entirely and
  still marking `Modal` as "coming soon" despite its full doc page. Regenerated the Components
  table 1:1 against `lib/nav.ts`, added the missing "Custom Components" section (Date range - README
  had no such section at all), and updated Patterns to reflect Navigation/Tree selection now having
  real content. No code changes - a markdown-only fix.
- **New standing typography rule, per direct user request: real component copy that can wrap
  carries `text-balance` (`text-wrap: balance`).** Documented in `/primitives/typography`'s new
  "Text wrapping" section and folded into the QA checklist above (item 6) as a standing check for
  every future ingest. Applied this pass across every DEW component with a title/description/
  label/hint-shaped prop: `Modal` (`ConfirmationModal`/`DestructiveModal`/`FormModal`, title +
  description each), `AlertFloating`/`AlertFullWidth` (title + description), `ToastCard` (title +
  description), `SectionHeader` (`Heading`/`Subheading`), `Accordion` (item title), `Tooltip`
  (title + description), `Checkbox`/`RadioButton`/`Toggle` (label + hint), and all 6
  `components/base/radio-groups/**` layouts (title/description slots - deliberately skipped the
  name+secondaryTitle pairs in `radio-group-avatar`/`radio-group-icon-simple`/`radio-group-
  checkbox`/`radio-group-radio-button`, since those sit inline in one flex row by design, not as
  independent wrapped lines). Left untouched: `Badge`/`Tag` labels, `Button` labels, `Table` header
  cells, `Dropdown` menu item labels, `Select`'s `select-item.tsx` description - all intentionally
  single-line (`truncate`/`whitespace-nowrap`), where `text-balance` has nothing to do since the
  text never wraps in the first place.
  - Verified `tsc`/`lint` clean (one pre-existing, unrelated lint error surfaced in `tooltip.tsx`
    at a line this pass didn't touch - confirmed via `git diff` showing only the two intended
    `text-balance` additions - left alone, not this pass's to fix) and a live Playwright pass:
    opened a real `DestructiveModal` instance and confirmed `getComputedStyle` reports
    `text-wrap: balance` on both its title and description; confirmed the same on `SectionHeader`'s
    live `Heading`/`Subheading` instances specifically (distinct from the doc page's own unrelated
    `.prose-doc` headings, which also carry `text-balance` but for a different, pre-existing
    reason) and on `Accordion`'s item title - zero console errors throughout.
- **`/pages/biodata-home` - the public marketing home page.** First built from the user's own pasted
  landing-page copy with no Figma frame to check against; the user then supplied the real frame
  (`https://www.figma.com/design/u4FTv88XXfy58MiLN5T5Wu/Home---Landing-Page?node-id=155-168`, node
  `155:168`, "Version 3") and, per "Figma is the source of truth" above, the whole page was re-audited
  and corrected against it directly rather than left as the first pass's best guess. Unlike every
  other `/pages/*` screen so far, this one has no icon-rail/contextual-sidebar shell at all - it's a
  top-nav marketing page (sticky header, hero, stacked full-width sections, footer). The header/nav
  itself has **no equivalent node anywhere in the frame** (nothing renders above the hero in
  `155:168`'s own tree) - kept as simplified structural chrome per this file's explicit
  nav-chrome-is-exempt-from-Figma-fidelity rule, not pixel-matched because there's nothing to match.
  - **Real exported assets, not fabricated photography.** Every photo/illustration the frame actually
    uses - the hero background, About's background, the Contribute/personas photo, the Knowledge
    Centre photo, the two Explore product-screenshot mockups, the Acknowledgement of Country artwork,
    and the floating cube/treehouse decorations - was pulled via `get_design_context`'s asset URLs and
    committed under `public/pages/biodata-home/` (`sips` used to confirm/keep native resolution after
    an accidental upscale on the first download pass - re-fetched at native size rather than shipping
    an upscaled, blurrier file). None of this page's imagery was invented or swapped for stock photos.
  - **Fredoka (Google Font) loads for the hero's stacked wordmark only**, matching the frame exactly -
    a third, explicitly page-scoped exception to "Geist stays Geist, Barlow stays Barlow" above, not a
    sitewide font change. Loaded locally in `page.tsx` via `next/font/google`, not added to the root
    layout. The frame hand-positions each word ("Discover"/"South Australia's"/"Biodiversity"/
    "Knowledge") at its own size/offset for a fixed 1728px canvas; adapted here into a responsive
    stacked heading with the same relative size hierarchy rather than cloning absolute pixel offsets,
    since per-word absolute positioning doesn't survive a real viewport.
  - **The first pass's content-only guesses were corrected against the real frame** in several
    concrete ways once `get_design_context`/`get_metadata` were actually run against it:
    - **"Where to next"'s featured card is "Learn what is BioData SA" (`compass-03` icon), not
      "Explore".** The 2x2 grid beside it holds Explore/Dashboard and Reporting/Contribute Data/
      Knowledge Centre - the first pass had guessed Explore as the featured card since its CTA
      ("Start Exploring") reads as the obvious lead item; the frame's own metadata (node `155:225`)
      showed otherwise.
    - **The Flora/Fauna/Fungi & Other breakdown is 3 horizontal progress bars next to the growth
      chart, not a pie/donut.** There is no pie anywhere in this frame - the first pass reached for
      the existing `PieChart` component on the reasonable but wrong assumption that a 3-way percent
      breakdown defaults to a pie; corrected to plain labelled bars (`KingdomBars` in `page.tsx`),
      matching node `155:566`'s own `Container`-with-a-width-percentage markup exactly.
    - **"Researchers/Citizen Scientists/Field Surveys" are 3 static icon+label badges, not a `Tabs`
      switcher.** No panel content, no selection state - just three circular icon badges over a photo,
      paired with the Contribute copy in one dark, gradient-backed section (node `155:259`). The first
      pass built a real `Tabs` control for these on the assumption that 3 named items imply switching;
      the frame shows they don't.
    - **Explore's right column is 2 real overlapping product-screenshot mockups** (downloaded assets,
      node `155:400`'s `image 22`/`image 23`), not a `Map01` icon illustration.
    - **The Growth+Dashboard section is solid black (`bg-black`)**, and its 4 stat tiles
      (`155:650`/"Frame 47") have **no card border or background** - they float directly on black,
      unlike every other stat tile on this page (hero's stat cards, About's "Trusted since 1974"
      card). Confirmed by reading the section's actual Tailwind output, not assumed from visual
      similarity to the other stat blocks.
    - **The "Where to next"/Knowledge Centre/footer copy groupings the first pass reconstructed from
      the plain-text scrape (row-major pairing, the `References`/`Training resource` placement, the
      footer's Explore/Contribute/Resources link split) all turned out correct** once checked against
      the frame's real metadata - confirmation the reconstruction reasoning held up, not just a lucky
      guess, and worth trusting the same reasoning next time a similarly-scraped content dump shows up
      with no frame to check it against yet.
  - **Internal links point at a real page wherever one already exists**, never an in-page anchor
    standing in for a page that's actually built: `Dashboard and Reporting`'s `View Dashboard`, the
    Dashboard section's `Open Dashboard`, and the footer's `Dashboard & Reporting` all point at the
    one real canonical `/pages/dashboard`; the featured Explore card, the Explore section's own
    `Search in BioData SA` button, and the hero search's submit all point at
    `/pages/project-list/option-1` (the real records catalogue) rather than faking search results in
    the hero itself - there's no search backend on this marketing shell to back real results with,
    same "take them to a real page, don't fake a working feature" convention as
    `GlobalProjectSearch`'s disabled Datasets/Species rows. Anything named in the copy with no real
    destination anywhere in this build (`NatureMaps`, `Publications`, `Biodata Catalogue`, `Data
    Standards`, `Survey Guidelines`, `Data Licencing Agreement`, `Citizen Science`, `Contact Us`)
    renders as plain, non-interactive footer text - same convention as `registeredUserFooterLinks`
    elsewhere in this build, never a fake `href="#"`.
  - **`Login` is disabled with a "coming soon" tooltip**, same `GuestAuthActions` convention as the
    signed-in shells - there's no real auth flow anywhere in this build.
  - **"Biodiversity Records Growth" (`+297%`, 2019-2026) plots a derived compound-growth index
    (2019 = 100), not invented absolute record counts.** The frame gives the aggregate percent and the
    year range, not a real per-year dataset - interpolating a smooth index between those two given
    numbers is a visualisation of what was actually provided; inventing plausible-looking yearly
    totals to plot instead would have been fabricating data and presenting it as real.
  - **A stray Untitled-UI-default gray surfaced in the frame and was normalized, not copied
    verbatim.** Several text layers (the eyebrow labels, a secondary button's text colour) are bound
    to `#414651` - Untitled UI's own stock `gray-700`, which does not exist anywhere in this
    codebase's real, rebranded gray scale (DEW's actual `gray-700` is `#585451`, confirmed
    sitewide). Read as a Figma variable-binding artifact (those specific layers never got switched to
    the DEW colour mode the rest of the frame uses) rather than a deliberate second gray scale -
    normalized to the semantic `text-quaternary` token this codebase already uses for every other
    small-caps eyebrow label, instead of introducing a foreign hex sitewide.
  - Obvious source typos were corrected, not transcribed literally (and confirmed to exist in the
    frame's own text layers, not just the pasted copy): `"Kinddoms"` -> `"Kingdoms"`, `"Dat
    Contributors"` -> `"Data Contributors"` (Dashboard section stat labels). Every em/en-dash in the
    copy is a plain hyphen per the no-em-dash rule above.
  - QA run: `tsc --noEmit` and `npm run lint` both clean on the rebuilt file; a live Chrome pass
    (`claude-in-chrome`) scrolled the full page end to end and confirmed every section matches the
    frame (hero photo + gradient + Fredoka heading + stat cards, the corrected featured "Where to
    next" card, the real About/Contribute/Knowledge Centre photography, the black growth section with
    bars instead of a pie, the real Acknowledgement of Country artwork, the footer) with zero console
    errors.
  - **Two real mismatches surfaced after this pass, via the browser's own inline Figma-feedback
    tool (`Agentation`) rather than caught in the original audit - fixed on sight, not deferred:**
    - **The hero search bar had its input placeholder and button label swapped.** Re-fetching
      `get_design_context` on the exact node (`155:193`, "Frame 85") showed the long
      `Try: "Red Kangaroo in Deep Creek National Park" or "Study on Rare Rodents"` string is the
      **input's placeholder**, not separate hint copy underneath it, and `Search in BioData SA` is
      the **button's label**, not "Search". The first pass had also carried over
      `"This is a hint text to help user."` from the earlier plain-text build as the input's `hint`
      prop - that string does not exist anywhere in this frame at all; removed rather than kept as a
      harmless leftover. Lesson: a partial/truncated `get_design_context` read (this exact node was
      only ever seen truncated, inside the giant root-frame dump) is not the same as having actually
      read it - re-fetch the specific node directly rather than trusting an earlier partial capture,
      especially for anything with more than one text string in it.
    - **The Contribute section's photo was wrapped in the page's standard padded `Container` and
      given a fabricated `rounded-l-2xl`.** Figma's own markup for this section (node `155:259`) has
      the photo as a true 50/50 flex child filling the section's full height and touching the true
      left edge, no radius at all - `Container`'s `mx-auto max-w-container px-4 md:px-8` insets
      everything inside it uniformly, which is exactly right for text content but wrong for a
      full-bleed image half, and the rounding was invented, not sourced from the frame. Fixed by
      pulling this section's outer wrapper out of `Container` entirely (a plain
      `mx-auto max-w-[1728px]` - matching the frame's own authored canvas width instead of this
      site's narrower 1280px docs container - with no side padding) and moving the padding onto the
      text column alone. **The same "is this a full-bleed frame element or does it just happen to
      sit near one" check is worth re-running on any future edge-to-edge photo half** - About's own
      full-bleed background photo was built correctly (as an `absolute inset-0` layer behind
      `Container`, never inside it), which is the pattern to copy, not `Container`-wrapping-with-a-
      rounded-corner. The Acknowledgement of Country photo had the same invented-rounding mistake
      (a `rounded-xl` with no basis in `155:169`'s actual markup) - caught and fixed in the same pass
      once the pattern was spotted, not left for a second report.
  - **A third round asked explicitly to match node `155:185` (the hero content frame) pixel-for-pixel**
    - re-fetched `get_design_context` on that exact node (not relying on the first, truncated
    root-frame dump) and found several real sizing/spacing misses beyond what the second round's
    feedback had already caught:
    - **The four stacked hero words are all plain white** - "Biodiversity" has no colour override
      anywhere in the frame. The first two passes had it in `#b3dbdb` (light teal) as an invented
      accent; removed.
    - **The word-stack is a fixed-canvas overlapping collage** (all four words in one CSS grid cell,
      positioned purely by `margin-left`/`margin-top`, per-word font sizes 40/72/102/64px and weights
      medium/semibold/semibold/regular) - not four consecutive centred lines. Reproduced pixel-for-
      pixel via the same grid-stack + margin-offset technique, shown from `lg` up (the collage only
      reads correctly at its authored size); a plain centred stack still covers narrower viewports
      since the fixed offsets can't scale down.
    - **The search bar is `1024px` wide, not `max-w-3xl` (768px).**
    - **The intro paragraph is `20px` (`text-xl`), not `16px`, has a bold "Biodata SA" lead-in
      before regular body text, and the frame authors an explicit 2-line break** ("...biodiversity
      information platform -" / "supporting conservation...") rather than letting it reflow - all
      three were missing (plain 16px, no bold lead-in, no forced break).
    - **The four stat cards are fixed at `310px` each in a `flex-wrap` row, not grid cells**, and
      their label text is `20px` (`text-xl`), not `18px` (`text-lg`) - the grid layout happened to
      look similar at one viewport width but doesn't wrap the same way `flex-wrap` does once the row
      no longer fits 4 across.
    - Lesson carried forward from the second round's search-bar mixup, reconfirmed here: a node seen
      only inside an earlier, larger/truncated `get_design_context` call is not the same as having
      actually read it - re-fetching the exact node directly is what surfaced every one of these,
      none of which were visible from the screenshot alone at normal viewing size.
  - **A fourth round of feedback (10 items via the browser's inline Agentation tool) found a mix of
    genuinely new issues and stale re-reports of items already fixed in earlier rounds:**
    - **A systemic container-width bug, not a one-off.** This page's shared `Container` used this
      site's default docs-page width (`max-w-container`, 1280px) - but Figma's own sections aren't
      built on that width at all. Re-deriving each section's real content width from its own frame
      (`x`/width maths, e.g. `1728 - 2*80px padding = 1568px` for Explore/Knowledge Centre/
      Acknowledgement, `144px` margins = `1440px` for "Where to next", a `1280px` column for the
      footer, a `1446px` frame for the hero) explained several complaints at once: the 4 hero stat
      cards wrapping to 3+1 instead of one row, "check the spacing" on "Where to next", and part of
      "colors are not as per figma" on its cards (never actually fetched past metadata before this
      round - see below). Fixed by widening `Container`'s own default to `1569px` (the most common
      real width) and overriding per section where the real width differs, **and** by not
      double-stacking the shared padding on top of a section-specific `max-w` override that already
      equals the frame's true, already-inset content width (the hero fix specifically - `lg:px-0`
      instead of `lg:px-20`, since `max-w-[1446px]` already *is* the correct content width with
      nothing further to inset).
    - **"Where to next" had never actually had `get_design_context` run on it before this round** -
      every earlier pass built it from `get_metadata` alone (dimensions and text, no real Tailwind
      output), so the gap between the featured card and the grid (guessed at `gap-6`, actually
      `40px`), the card's internal layout (guessed as a circular icon badge, actually a bare 120px
      `compass-03` with no badge at all), the grid cards' fixed `160px` height (guessed as
      auto-height), and the card text/link colours (guessed brand-teal, actually white-on-gradient
      for the featured card and a muted `link-gray` for the grid cards, not `link-color`) were all
      real, previously-unverified guesses that turned out wrong once the actual node was fetched.
      Same root cause as the hero and Contribute mixups in earlier rounds: metadata tells you
      dimensions and text content, never colours, spacing, or which real component variant to use -
      `get_design_context` is not optional for any section this page still needs to get exactly
      right, even ones that already "look about right" from a screenshot.
    - **The "Trusted since 1974" card's position was wrong** - it's centred and non-overlapping in
      the first build, but the frame (node `155:563`) places it at 61% across / 91% down the About
      section, deliberately overflowing 50px past the section's own bottom edge onto the section
      below. Fixed by moving `overflow-hidden` off the whole `<section>` and onto just its background-
      image layer, so the card can hang past the boundary the way the frame does instead of being
      clipped or kept safely inside.
    - **The persona statement ("Whether you're a researcher...") was centred; the frame left-aligns
      it** at a fixed `x: 135px, width: 791px` - not a symmetric statement banner. Approximated as a
      left-aligned block near that width rather than centred.
    - **Two decorative SVGs (`cube-02`/`cube-03`) were placed in the hero section** on a first-pass
      guess that "hero decorations" belong near the hero. Their real frame coordinates (`155:176`/
      `155:177`, y = 2939/3254) put them roughly at the About/Explore boundary, well past the hero
      entirely (which ends around y = 1087). Removed from the hero rather than left in the wrong
      section; not re-added elsewhere this pass (a small decorative flourish, not core content -
      logged here rather than silently dropped). `treehouse.svg`'s own position was also
      re-checked against its real coordinates (`155:178`, x:1080/y:969 - the lower-right of the
      hero's own photo, bleeding off the canvas edge) and moved from the top-right to the
      bottom-right of the hero to match.
    - **The sticky header used `bg-primary/95 backdrop-blur-sm`**, which reads as slightly tinted/
      blurred over the dark hero photo while scrolling - changed to a flat `bg-white` since the ask
      was specifically an opaque, unblurred header at all scroll positions.
    - **The DEW/SA Government logo was `h-8` (32px); asked to be exactly `38px`** - corrected
      directly (`h-[38px]`, width still auto so it scales proportionally).
    - Two of the ten items (the Contribute photo, the hero search bar) were exact re-reports of
      issues already fixed in the prior round - most likely stale feedback captured against a
      pre-fix page state rather than a new regression; verified both were still correct after this
      round's changes rather than assuming the report was simply outdated.
  - **A fifth round (outside this session, not logged here at the time - see `page.tsx`'s own file-
    header comment for its full "20-point user annotation review") moved `treehouse.svg` out of the
    hero entirely** (its real coordinates, y:969-1856 of the 1728px canvas, place it bleeding from
    the hero into the persona-statement section below, not pinned to the hero's own corner as the
    third round above had it) **and made several further spacing/gradient/gap corrections** -
    "Where to next"'s 64px row-gap vs 40px column-gap, the featured card's real gradient stops
    (34%/81.3%/133.7%), a thinner `Compass03` stroke to match the real exported icon weight,
    Contribute's persona/divider/heading spacing, and the Explore mockups' size and bottom-bleed.
    **This CONTEXT.md entry hadn't been updated to match at the time** - the "moved to the hero's
    bottom-right" line three entries above is stale; `page.tsx`'s own header comment is the accurate
    record of that round, and this entry is corrected here rather than left contradicting the code.
  - **Sixth round: the persona-statement + "Where to next" section still didn't match a supplied
    reference screenshot, for a reason specific to reusing one asset across two backgrounds.**
    `treehouse.svg`'s real fill is white (correct on the dark hero it's also used on) - moved as-is
    into the persona-statement section (which sits on a white background) in the fifth round above,
    it renders invisible there; only its 30%-opacity background circle showed. Fixed by generating
    `treehouse-light.svg` - the exact same real path data, fill recoloured to a pale brand tint
    (`#C3D9DF` path, `#DCECEF` circle) - a legitimate recolour of a real downloaded asset for a
    different background context, not fabricated artwork; the shape itself is untouched. Also
    restored two small decorative circles at the featured "Where to next" card's bottom-left corner
    (visible in the reference, absent from every build so far) as plain CSS circles (`bg-white/10`
    and `bg-white/40`) rather than reproducing them as an image - a generic decorative dot needs no
    real vector asset the way a real icon does. The section's `overflow-hidden` was also removed so
    the (now-visible) graphic can bleed down into "Where to next" below it, matching the reference,
    the same "let a deliberate overlap hang past its section" fix already applied to the About card
    and the Contribute photo in earlier rounds.

- **`/pages/observations/option-1` - the map search interface, built per direct request.** Observations
  used to be inert `items` text with no real page behind either "View Level 1 Public Observation
  Data" or "View Level 2..." (see `lib/registered-user-nav.ts`). Per direct request for a real
  map-search tool - draw a circle/polygon, enter coordinates, or pick a South Australian national
  park, then see matching Projects/Events/Occurrence/Observations in a tabbed table - Observations
  is now a keyed leaf, same "leaf with its own key" shape Home and Projects already have, reached
  for real from every sidebar shell's icon rail via the existing generic `goToSection`/`keyHref`
  machinery with no per-shell changes needed. Two ALA-style screenshots and a rough BDBSA wireframe
  page (`YMproGZfrFB5jUqPHPxMhk` node `165:12361`, which turned out to be a Reports gallery, not a
  results screen - the link didn't point where expected, so it was treated as loose inspiration
  only, not fetched further) were given explicitly "for reference only," with instructions to
  design the actual UX - not a Figma frame to pixel-match.
  - **A real, working map, not a fabricated grid or a static image.** `leaflet` + `react-leaflet`
    + real OpenStreetMap tiles (`app/pages/_shared/map-search/sa-map.tsx`), loaded via
    `next/dynamic({ ssr: false })` since Leaflet touches `window` at import time. Kept in
    `app/pages/_shared` rather than `components/custom` - same precedent as this build's other real
    map widget, `app/pages/_shared/map-view.tsx` (a Highcharts map), neither of which has a
    stakeholder-decided home yet. The existing `MapView` (Highcharts) was checked first and ruled
    out - it only has Australian state-level geometry, no zoom/pan/drawing, wrong tool for this job.
  - **Drawing uses `leaflet-draw`'s real `L.Draw.Circle`/`L.Draw.Polygon` handlers, triggered by
    real DEW `Button`s in the search panel instead of the plugin's own dated toolbar chrome** - the
    created layer is captured into a `Boundary` (`{kind:"circle", center, radiusKm}` or
    `{kind:"polygon", points}`, `app/pages/_shared/map-search/geo.ts`) and immediately removed from
    the map, since the boundary is re-rendered declaratively via react-leaflet's own `<Circle>`/
    `<Polygon>` - one consistent rendering path regardless of which of the 3 methods produced it.
    Real bug caught and fixed during QA: calling `.getBounds()` on a `L.circle()`/`L.polygon()`
    instance that was never added to the map throws ("Cannot read properties of undefined (reading
    'layerPointToLatLng')") - it needs `_map` internally. Fixed by using `LatLng.toBounds()`/
    `L.latLngBounds()` instead, which compute bounds from raw coordinates with no map attachment
    needed - caught live via the browser's own runtime error overlay, not just a code read.
  - **The national park list is real** (`SA_NATIONAL_PARKS` in `geo.ts`) - 17 of South Australia's
    actual National Parks (not Conservation Parks/Regional Reserves, a distinct lower tier in SA's
    own system, per the user's specific ask), with approximate centroid coordinates, honestly
    documented as approximate rather than surveyed boundaries - the same convention already used for
    `MapView`'s own state-level-only map data.
  - **Search results reuse the real Projects data instead of forking a disconnected dataset** -
    `app/pages/_shared/map-search/search-data.ts` imports the same `projects` array
    `ProjectListContent` renders, gives the 4 you already have real coordinates for, and adds a
    handful more public projects (not yours) so the search covers more of the map than just your own
    list - a project can honestly show up in both your Projects list and a spatial search over all
    public records, since those are two different, both-real things. Events/Occurrence/Observations
    are new mock datasets, but grounded in this build's own established conventions: real event
    types already used in project-detail's record tree (Visit/Transect/Quadrat/Block/Ramble/Trap/
    Custom Event), real South Australian native species (Red Kangaroo, Malleefowl, Pygmy Bluetongue
    Lizard, ...), and the existing Olivia Wyatt/Maya Dewitt/Phoenix Baker/Lana Steiner placeholder
    persona set for observer names - never invented taxa or fabricated org names out of pattern.
  - **Filtering is real, not decorative** - a circle boundary filters by real haversine distance, a
    polygon by a real point-in-polygon test (`isPointInBoundary` in `geo.ts`), both against each mock
    record's own lat/lon, combined with an optional keyword filter (species/project/org substring
    match). Verified live across all 3 boundary methods (drawn circle, entered coordinates, and a
    selected national park) - each correctly surfaced only the records actually near that area.
  - **The old Level 1/Level 2 nav text isn't silently dropped** - every role sees the same Level 1
    (public) results today, with an honest note on the results screen (registered-user only, since
    guest has no DLA section to reference) that Level 2 access is managed separately under Data
    Licencing Agreement (DLA) - building real DLA-gated result filtering is a separate, larger piece
    of work than this search UI, logged here rather than silently built or silently dropped.
  - Verified `tsc --noEmit` and `eslint` clean on every touched/new file, and a live Chrome pass
    across all 3 boundary methods, both roles, and all 4 result tabs - zero console errors (one real
    runtime bug, the detached-layer `getBounds()` crash above, was caught this way and fixed before
    being called done).
  - **Follow-up round, per direct feedback on the shipped screen: two fixes.**
    - **The nav item itself is renamed "Observations" -> "Explore" with a map-search icon
      (`Map01`, replacing `Eye`)** - `lib/registered-user-nav.ts`'s label in both
      `registeredUserNav`/`publicUserNav` (the `key`, `keyHref`, and the route
      `/pages/observations/option-1` are all untouched, only the visible label/icon), flowed
      through to every `sectionIcons` map that keys off that label:
      `project-list/option-1`, `project-detail/option-1`, `dashboard/page.tsx`,
      `observation-detail/option-1`, this page's own copy, and the docs' `patterns/navigation`
      illustration of the same real IA. "Observations" is deliberately *not* renamed everywhere -
      it's still the correct name of one of the 4 record types this very screen searches for (the
      `entityTabs` results tab, `Table aria-label="Observations"`) and of the unrelated
      Project→Site→Observation→Occurrence record-tree leaf type used across `project-detail`/
      `observation-detail`/the `proto/*` labs - only the *nav section's* label/icon changed, not
      the domain noun.
    - **The "Boundary method" tab list (Draw on map / Enter coordinates / Select a location)
      switched from a horizontal segmented control to vertical, full-width stacked rows** - 3 full
      text labels didn't fit a 360px panel horizontally without cramping, flagged directly by the
      user. Same `TabList`/`Tab` components, just `orientation="vertical"` (matching the pattern
      already used for Home's/Projects' own vertical tab switchers elsewhere in this build) instead
      of a new component - the panel already had vertical room to spare, so this was a one-line
      orientation change, not a redesign.
    - Verified `tsc`/`eslint` clean and a live Chrome pass across `/pages/observations/option-1`,
      `/pages/project-list/option-1`, and `/pages/dashboard` (all 3 confirmed to show the map icon,
      not a stale eye) for both public-user and registered-user - zero console errors.
  - **Second follow-up: the user supplied a real Figma node for this exact panel** (`node-id=
    188-4788`, same landing-page file this whole build started from) "as a reference to
    improvise" - and it turned out to be the actual spec for the boundary-method tab row the
    previous round had just switched to vertical. The reference shows the 3 tabs back in a single
    horizontal row (icon + label each, `type="button-border"`'s real bg-secondary tray/bg-
    primary_alt-plus-shadow active state - a style this codebase already had, just never fit at
    the width it was given), each a fixed ~155px, comfortably fitting a ~480px-wide container - not
    the 360px this panel had. **The real bug was the panel's width, not the tabs' orientation** -
    reverted the vertical-tabs workaround and widened the boundary-method panel to `480px`
    (`lg:w-[480px]`, was `lg:w-[360px]`) instead, which is what actually fixes "not enough space"
    per the reference rather than working around it. Every other part of the reference (the
    disabled-placeholder "Choose a park" select, the vertical radius stepper, the 50%-opacity
    disabled "Search records" button) was already exactly how this panel was built - confirmed by
    comparison, not changed. Verified `tsc`/`eslint` clean and a live Chrome pass across all 3
    method tabs at the new width - comfortable spacing, no cramping, zero console errors.
  - **Third follow-up: multiple simultaneous search areas, per direct feedback ("allow to add
    multiple location selections" on Draw on map; "call the selection of location as select
    location and allow for multiple location selection" on the park picker), plus per-vertex lat/
    long for a drawn polygon ("provide lat and long for each point selected... separated by a pipe
    or a comma").** A real architecture change, not a cosmetic one - `Boundary | null` became
    `Boundary[]`, and every consumer (the map, the filters, the summary line) now works over the
    whole set, the union of every active area, not just the latest one.
    - **`Boundary` gained `id` (stable identity for list rendering/removal) and an optional
      `source`** (`park:<id>` for park-derived circles) so a park selection can recompute or remove
      *just its own* boundary without touching an independently drawn shape or entered coordinate -
      see the updated doc comment on `Boundary` in `app/pages/_shared/map-search/geo.ts`.
    - **Draw on map**: every completed circle/polygon is now *appended* to the list
      (`onBoundaryAdd`, not `onBoundaryChange`) instead of replacing the previous one - `sa-map.tsx`
      renders every boundary in the list simultaneously and `FlyToBoundaries` (renamed from
      `FlyToBoundary`) fits the map to all of them at once, extending one `L.LatLngBounds` per
      boundary rather than measuring just one.
    - **Enter coordinates**: "Apply" is now "Add point" - each press appends a new circle boundary
      and clears the Latitude/Longitude fields (a `coordResetKey` bump remounts those two
      `InputNumber`s) while leaving the radius field alone, so entering several points in a row at
      the same radius doesn't require re-typing it each time.
    - **Select a location: renamed field label "National park" -> "Select location", and the
      single-select `Select` was swapped for the real `MultiSelect`** (same component family,
      `components/base/select/multi-select.tsx` - a full listbox-in-popover with its own search and
      Reset/Select-all footer, not a custom build). Selected parks are derived reactively
      (`parkBoundaries`, a `useMemo` over `selectedParkIds` x the one shared radius input) rather
      than stored as their own imperative list, so changing the radius live-updates every currently
      selected park's boundary at once, and deselecting a park cleanly drops just that one circle.
    - **Removing a boundary is one shared list now, not a single "Clear"** - every active boundary
      (drawn, entered, or park-derived) renders as its own row with a "Remove" button
      (`removeBoundary`, which knows to toggle a park out of `selectedParkIds` vs. splice a manual
      one out of `manualBoundaries` depending on `source`), plus a "Clear all" action once more than
      one is active. A results view with its last boundary removed falls back to the search view
      automatically - computed as a `displayMode` derived value, not synced via a `useEffect`
      (the first attempt used an effect calling `setMode`, correctly flagged by lint's
      `react-hooks/set-state-in-effect` rule as an avoidable cascading render - fixed by deriving
      instead).
    - **Polygon summaries now list every vertex's own "lat, lon" pair, points separated by " | "**
      (`boundarySummary` in `geo.ts`) instead of a bare point count - e.g. `Polygon: -29.73, 130.25
      | -29.73, 134.52 | -33.36, 132.39`, confirmed live off a real 3-point polygon drawn on the
      map, not just read from the source.
    - **Filtering checks every active boundary, not one** - `isPointInAnyBoundary` (`geo.ts`) is
      `boundaries.some(isPointInBoundary)`; every one of the four result-tab filters was switched
      from the single-`boundary` check to this union check.
    - **QA note specific to this round: verifying leaflet-draw's Polygon tool via the browser
      automation tool needed `hover` immediately before each `left_click`, not just the click
      alone.** leaflet-draw places polygon vertices via an invisible 40x40px marker that follows
      real `mousemove` events and only adds a point on that marker's own `mousedown`/`mouseup` - a
      scripted click with no preceding move to that exact coordinate can leave the marker at its
      stale position, so the click lands on the bare map pane (which only listens for `mouseup`/
      `mousemove`, not `mousedown`) and silently drops the point. Real mouse use never hits this
      (physically moving the cursor to a point always generates the intermediate `mousemove`) - a
      testing-tool nuance, not a product bug, but worth recording since it cost real time to
      diagnose and will recur for any future automated QA pass that draws a polygon.
    - **Also noted, not fixed - pre-existing `MultiSelect`/`Autocomplete` behaviour, not something
      this feature introduced:** pressing Escape while its popover is open clears the current
      selection entirely (confirmed reproducible), not just closes the popover the way clicking
      outside it does. Clicking outside is the reliable way to commit a multi-select and was used
      for every verification in this round; flagged here as a candidate gap for whoever next touches
      `components/base/select/multi-select.tsx`, not fixed as part of this page's own work.
    - Verified `tsc`/`eslint` clean and an extensive live Chrome pass: two circles drawn and kept
      simultaneously (each removable on its own), a real 3-point polygon drawn and closed with the
      correct pipe-separated vertex summary, two national parks selected together (Belair + Flinders
      Ranges) producing two independent circles with the map fitting both, and a combined search
      across those two parks correctly returning 14 records across both regions (2 projects, 4
      events, 4 occurrences, 4 observations) - zero real console errors throughout (one recurring
      "asynchronous response" message is a generic Chrome-extension-messaging artifact unrelated to
      this app's own code, confirmed by its `0:0` line/column attribution).
  - **Fourth follow-up: the boundary-method panel and the map now sit flush, per direct feedback
    ("remove all padding corner radius").** The outer row's `gap-6 p-6 pt-0` is gone (just `flex
    flex-1 flex-col lg:flex-row` now), and `rounded-xl` was dropped from both the panel (still
    `border border-secondary bg-primary p-4` - its own internal content padding is untouched, only
    the outer spacing/rounding) and the map wrapper (its `border border-secondary` was dropped too,
    matching the reference screenshot's borderless, edge-to-edge map). Verified `tsc`/`eslint` clean
    and live - both panels now render with sharp square corners, flush against each other and the
    viewport edges, zero console errors.
  - **Fifth follow-up, the largest yet: the results body rebuilt to match a real Figma reference
    (`node-id=180-1428`, same landing-page file) - four tabs (Events/Occurrences/Observations/
    Resources, replacing the old Projects/Events/Occurrence/Observations four), a real Hierarchy
    column, per-table customise-columns, and a row-click detail panel.**
    - **"Projects" is no longer its own tab or its own dataset - a Project *is* an Event now**,
      per the user's own domain framing ("A project is an event and under project there shall be
      other events such as sites, visit, transect..."). `search-data.ts`'s `SearchEvent` unifies
      what used to be two separate arrays (`searchProjects` + `searchEvents`): every existing
      project becomes a root Event (`type: "Project"`, no `parentId`), extended with real child
      Sites and a further level of Visits/Transects/Quadrats/Blocks/Rambles/Traps/Custom Events
      under several of them (`eventAncestors`/`hierarchyFor` walk this real parent-pointer chain -
      not a fabricated static string). A brand-new `searchResources` dataset (Images/Files/
      Reference Links, each genuinely attached to a real Occurrence and inheriting that record's
      location) was added as the fourth tab, since it didn't exist as a concept before this round.
      Occurrence/Observation counts were also roughly doubled (12→16 each) and Events grew from 14
      to 25, per direct instruction to "add more... more projects, more sites etc." without
      changing the table structure itself.
    - **Hierarchy column**: a plain breadcrumb of ancestor ids (`geo`-adjacent `eventAncestors`/
      `hierarchyFor` helpers, rendered by the new `HierarchyCell` in `results-table.tsx`) - "-" for
      a root Project or a record attached directly to one, otherwise every ancestor id down to and
      including the record's own immediate parent event, confirmed live with real chains like
      `adelaide-hills › site-adelaide-1`. Deliberately **not** the Figma reference's own per-level
      show/hide-levels dropdown menu - that reference's own example data repeats one identical
      placeholder chain on every single row regardless of the record shown, a clear sign it's
      illustrative filler, not a real interaction to replicate faithfully; a real breadcrumb of the
      actual computed ancestor ids covers the substance of "show the current hierarchy, ultimate
      parent always a project" without building a bespoke collapse-per-level UI for it - logged
      here as a deliberate scope call, not an oversight.
    - **Generic `ResultsTable` primitive** (`app/pages/_shared/map-search/results-table.tsx`) is
      now what each of the 4 tabs renders, instead of 4 hand-duplicated table blocks - owns the
      per-table search box, the sub-type filter chip row (Figma's own "All / Project / Site /
      Visit / ..." pattern, one real, working filter per entity's own type field), the
      "Customise columns" trigger, and the row-click detail panel. Column *definitions* (what each
      entity's columns are, how each renders, which are visible by default) stay in
      `page.tsx` next to the data they describe - the shared file owns table chrome/interaction
      only, not domain knowledge of what an Event or a Resource actually is.
    - **Customise columns**: a real sliders-icon button next to each table's search box opens a
      right-side `SidePanel` (a new generic slide-over built directly on react-aria's
      `ModalOverlay`/`Modal`/`Dialog` - the existing `components/application/modals/modal.tsx`
      pair hardcodes centre placement, so this needed its own thin wrapper, not a prop bolted onto
      that one) listing every real column for that table as a checkbox - toggling one shows/hides
      it live. Every column defined for a table is real and rendered somewhere already (never an
      invented "power user" column with no data behind it) - a deliberately smaller set than
      Figma's own ~30-column mega-table, most of which the reference itself never populates with
      real data past the first few columns either.
    - **Row click opens the same `SidePanel`, showing every one of that record's real fields** (all
      columns, not just the currently-visible ones) as label/value pairs - confirmed live on an
      Event row, correctly showing its full Hierarchy chain even when that column was toggled off
      in the table itself.
    - **Real bug found and fixed during QA: react-aria-components' `Table` cannot safely change its
      own column count at runtime via the "dynamic collections" API alone.** First attempt used the
      documented pattern (a `columns` prop + function children on both `Table.Header` and every
      `Table.Row`) - correct per react-aria's own docs, but still crashed live ("Cell count must
      match column count. Found 6 cells and 7 columns") the moment a checkbox toggled the set,
      because react-aria's Collection caches a row's rendered cells keyed by item identity and
      doesn't reliably re-invoke a row's render function just because the *external* `columns` prop
      changed underneath it, confirmed by reproducing the crash twice with the dynamic-columns API
      already in place. Fixed by giving the `<Table>` itself a `key` derived from the sorted visible
      column ids - a column-set change now remounts the whole table fresh instead of relying on
      react-aria's own diffing, which is simple, robust, and cheap at this table's real row counts
      (a dozen-odd rows, never thousands). Verified live, twice, with zero console errors after the
      fix - toggling "Status" on the Events tab now shows the real column immediately with no crash.
    - Verified `tsc`/`eslint` clean and an extensive live Chrome pass: a 1573km circle covering the
      whole state (69 records across all 4 tabs), sub-type chips filtering correctly (Project 8/
      Site 9/Visit 2/... on Events), a real Hierarchy chain confirmed on a Visit row via its own
      detail panel, the customise-columns panel toggling a real column live, and the Resources tab's
      real per-type icons, clickable Reference Link URLs, and inherited hierarchy chains all
      confirmed correct - zero console errors throughout the final pass.
  - **Sixth follow-up: the "deliberate scope call" on Hierarchy above was directly overridden by
    the user off a real screenshot of Figma's own interactive dropdown ("do not deviate from
    figma... The hierarchy columns must show the hierarchy of the events") - rebuilt as the real
    interactive widget, and all 4 tabs' column sets re-audited against Figma exactly.**
    - **`HierarchyCell` (`results-table.tsx`) is now a real, working per-row collapse control, not
      a static breadcrumb.** A small square "..." trigger (`DotsHorizontal`, matching Figma's own
      box, not `Dropdown.DotsButton`'s circular default) opens a real `Dropdown.Root`/`Popover`/
      `Menu` with exactly the four actions Figma's screenshot showed - "Show one level up" /
      "Hide one level up" / "Show all levels" / "Hide all levels" - each correctly disabled at its
      own boundary (e.g. "Show one level up" disabled once nothing is hidden). A self-contained
      `hiddenCount` state per cell instance (0 = every ancestor shown) drives which leading
      segments of the real ancestor chain are collapsed; the remaining segments still render
      chevron-separated, same real ids as before. The whole cell stops click propagation so opening
      the menu or picking an option never fires the row's own `onAction` (which opens the record
      detail panel) - same defensive pattern already used for the Resources tab's reference-link
      anchor. Verified live: opened the menu on a Site row, collapsed and re-expanded its one
      ancestor, and confirmed a 3-level chain (`flinders › site-flinders-1 › transect-flinders-1`
      on `quadrat-flinders-1`) renders correctly - zero console errors.
    - **Every tab's column set was trimmed to Figma's own exact 6 columns, dropping every column
      this build had separately invented beyond what Figma actually shows** - the earlier
      "deliberate, smaller subset of Figma's ~30-column mega-table" reasoning still holds for the
      *table's total width*, but the invented `defaultVisible: false` extras (Status/Region/
      Organisation on Events, Status/Region on Occurrences, Region on Observations, Date/Region on
      Resources) were never real Figma columns at all, just this build's own addition - removed
      rather than left as extra hidden options a Figma audit wouldn't back. Events: Event ID/Event
      Name/Event Type/Start Date/End Date/Hierarchy. Occurrences: Occurrence ID/Occurrence Name/
      Occurrence Type/Scientific Name/Date/Hierarchy (unchanged - already matched). Resources:
      Attached Resource/Type/Attached to Concept/Record ID/Record Name/Hierarchy (unchanged).
      `Badge` import dropped from `page.tsx` once the two columns that used it (Events'/
      Occurrences' Status) were removed.
    - **Observations' columns didn't match Figma at all - it had substituted an "Observer" column
      (name + avatar) for Figma's real "Scientific Name" column.** Fixed by restructuring
      `SearchObservation` (`search-data.ts`) to split its single `species` field into `commonName`
      + `species` (now genuinely the scientific/binomial name, matching `SearchOccurrence`'s own
      field naming), backfilling real scientific names for all 16 rows by reusing the exact
      binomial names this file already established for the matching species in `searchOccurrences`
      (e.g. Western Grey Kangaroo -> `Macropus giganteus`) rather than inventing new ones. Columns
      are now Observation ID/Observation Name/Observation Type/Scientific Name/Date/Hierarchy,
      matching Figma exactly; `observerInitials`/`observerName` stay on the data type (still real,
      just no longer rendered as a column) rather than being deleted outright.
    - **"Custom Event" (Title Case) -> "Custom event" (lowercase "event"), matching Figma's own
      chip label exactly.** Fixed at the source rather than just the display label - `EventType`'s
      literal union value in `search-data.ts` and the one data row using it (`custom-remarkable-1`)
      were both changed to `"Custom event"`, so the chip's `value`/`label` and the record's own
      `type` field never drift from each other.
    - Verified `tsc --noEmit` and `eslint` clean on every touched file
      (`results-table.tsx`/`search-data.ts`/`page.tsx`), then a fresh live Chrome pass across a
      69-record, 4-tab search: confirmed the "Custom event 1" chip label casing, all 4 tabs'
      column headers against the list above, the interactive Hierarchy dropdown's four actions and
      their disabled states, a multi-level collapsed/re-expanded chain, and zero console errors.
  - **Seventh follow-up: the user supplied a fresh, specific Figma link (node `205:20764`) and
    said directly "you are confused... make sure you follow the same" - the prior round had
    verified against cached screenshots from earlier in the session rather than actually re-fetching
    this exact node, and it turned out to document three more real, verifiable structural
    differences beyond what the cached screenshots had shown.** `get_design_context`/`get_screenshot`
    on `205:21340` (an instance of the same "Table View" component the earlier round already built
    from) confirmed the 6-column set per tab was already correct, but surfaced:
    - **Every Type column (Event Type/Occurrence Type/Observation Type/Resource Type) renders a
      real leading icon per sub-type, not plain text** - confirmed via the rendered screenshot
      (Folder for Project, a location pin for Site, a paper-plane for Visit, a dotted grid for
      Transect, a table-style grid for Quadrat, corner-crop brackets for Block, crossing arrows for
      Ramble, a compass/nav pointer for Trap, a plain outline circle for Custom event; a flattened
      oval for Individual, stacked layers for Population, a wave glyph for Non-Biotic, a people
      glyph for Community - the same 4-value `OccurrenceType` shared by Occurrences and
      Observations). Added `eventTypeIcon`/`occurrenceTypeIcon` maps in `page.tsx` (real
      `@untitledui/icons`: `Folder`/`MarkerPin01`/`Send01`/`Grid03`/`LayoutGrid01`/`Crop01`/
      `Shuffle01`/`NavigationPointer01`/`Circle` and `CircleCut`/`LayersTwo02`/`Waves`/`Users01`),
      rendered as icon+label in each Type cell - Resources' Type column already had a real
      `resourceTypeIcon` map (from the "Attached Resource" cell) but wasn't applying it to its own
      "Type" column cell, fixed to reuse the same map there too.
    - **The sub-filter chip row also carries the same icon per sub-type, plus its count renders as
      a small circular pill next to the label, not plain trailing text.** `TypeFilterOption`
      (`results-table.tsx`) gained an optional `icon` field, threaded through every `typeOptions`
      array in `page.tsx` (reusing the exact same icon maps as the Type columns, so the chip row
      and the column can never show a different icon for the same sub-type); the chip count became
      an inline `rounded-full bg-secondary` pill. **Real bug caught and fixed during this build,
      before ever loading it in a browser (would have been caught live either way, since the QA
      pass below did catch a first-attempt version of it):** the pill span was first written with
      `flex` instead of `inline-flex` - `display: flex` is a block-level box even though the parent
      `<span data-text>` (`Button`'s own internal text wrapper, `components/base/buttons/
      button.tsx`) is plain inline flow, so the block-level pill forced a line break, pushing the
      count onto its own line under the label instead of sitting beside it. Fixed by using
      `inline-flex` - an inline-level flex container that still centers the number internally but
      participates in the surrounding inline flow like any other inline element. Worth remembering
      generally: a `flex`/`grid` utility inside a plain (non-flex) inline parent always breaks the
      line, `inline-flex`/`inline-grid` is the one that doesn't.
    - **Every Type column header (`Event Type`/`Occurrence Type`/`Observation Type`/`Type`) carries
      a small `HelpCircle` tooltip icon next to the label** - confirmed in the screenshot on all 4
      tabs. `ColumnDef` gained an optional `headerTooltip` string, rendered via the same real
      `Tooltip`/`TooltipTrigger` components already used for the "Customise columns" trigger.
      Tooltip copy is real, sourced from this file's own already-established domain model (the
      Project→Site→.../Custom event hierarchy, the Individual/Population/Non-Biotic/Community
      taxonomy, Image/File/Reference Link) rather than fabricated - Figma's own screenshot doesn't
      expose the tooltip's actual text (it wasn't open in the capture), so the copy is honestly this
      build's own accurate gloss on the real taxonomy, not a guess at Figma's specific wording.
    - **Incidentally caught and fixed a real regression from the "Custom Event"/Scientific-Name
      round above**: `observationColumns`' `rowTextValue`/`searchText` still read `o.species` for
      the record's *display* name - correct before that round (when `species` held the common
      name), wrong after it (once `species` was repurposed to hold the real scientific/binomial
      name and `commonName` was added for the display name) since nothing had updated these two
      call sites to match. Fixed to `o.commonName`, with `searchText` now covering both
      `commonName` and `species` - the detail side-panel title and the row's own accessible text
      value were both silently showing a scientific name instead of the common one until this fix.
    - The Occurrences/Observations/Resources tabs (hidden instances inside the same Figma frame,
      `195:10266`/`195:10315`/`195:10353`) render as 1x1 blank screenshots when fetched directly
      (Figma doesn't rasterize a hidden instance) - re-confirmed their column sets and Type-column
      icon treatment instead via this session's still-cached screenshots of their own standalone
      frames from the prior round (`tableview1.png`/`tableview2.png`/`tableview4.png`, nodes
      `195:12572`/`195:18477`/`195:15188`) rather than re-fetching what Figma can't render anyway.
    - **The top-level 4-tab bar was left as the real DEW `Tab`/`TabList` component at the time -
      reversed in the eighth follow-up below, once the user asked directly to match this exact
      node pixel-for-pixel.** (Historical note, kept for the record rather than deleted: the
      two-line stat-tile shape genuinely doesn't fit `Tab`'s API, so the original call to avoid a
      one-off widget wasn't wrong given the ask at the time - see the eighth follow-up for why it
      was rebuilt.) Figma's real numbered pagination (rows-per-page select, `1 2 3 … 8 9 10`,
      "1-50 of 250") was already logged as a separate, bigger component in the `table` entry above
      when `TableCard.Pagination`'s simpler Page-X-of-Y/Previous/Next was built - still not
      revisited here, and doing so would also mean fabricating a much larger fake dataset just to
      have real numbers to paginate through, which this page's honest, real (if small) mock dataset
      doesn't support today.
    - Verified `tsc --noEmit` and `eslint` clean on every touched file (`results-table.tsx`/
      `page.tsx`), then a fresh live Chrome pass across all 4 tabs: confirmed every Type column's
      icon, every sub-filter chip's icon and inline pill count (including the `flex`→`inline-flex`
      fix rendering correctly), the header tooltip firing on hover, the Hierarchy dropdown still
      opening/closing and collapsing/re-expanding a real chain correctly, and zero console errors
      on a fresh page load.
  - **Eighth follow-up: the user re-supplied the same node (`205:20764`) with "ensure the whole
    page design remains the same as figma," which turned out to mean two real, previously-unbuilt
    pieces of this exact frame, not a re-confirmation of what the seventh round already covered.**
    - **"Edit search" was a bordered `Button`, positioned below the heading block - Figma has it as
      a plain link, positioned above it.** `get_design_context` on `205:23084` (the link) confirmed
      it's icon + `text-tertiary` text with no border/background, and the frame's own y-ordering
      (`205:23084` at y:24, the "Search results" heading block at y:64) puts it as its own row
      above the title, not beside it as a trailing action. `SectionHeader.Root` is `flex-col`, so
      simply moving the `Button` to be `Root`'s first child (before `Group`, dropping `Actions`
      entirely) reproduces the same order without a new component; the `Button` itself switched
      from `color="secondary"` to `color="link-gray"` (a real, already-used variant) to drop the
      border/background and match the link styling exactly.
    - **The 4-tab bar is now a real, working two-line stat-tile switcher, matching Figma's "Metrics
      section" exactly (`get_design_context` on `I205:21340;195:10228`), reversing the seventh
      round's "left as the real DEW `Tab`" call now that the user asked directly to match this
      frame precisely.** Plain `<button>` elements per tile (Figma's own generated markup uses
      `<button>`, not a tab/tabpanel ARIA role, confirming this is a composed structural switcher,
      not a mis-skipped real component) - active tile: `bg-primary`, a 1.5px bottom border only
      (`border-b-[1.5px] border-[var(--color-brand-500)]`, no border on the other 3 sides), icon +
      label in `text-brand-tertiary` (brand-600) at `font-medium`, the count in `text-brand-secondary`
      (brand-700); inactive tiles: `bg-primary`, a full 1px `border-[var(--color-brand-100)]` on
      all 4 sides, icon + label in `text-tertiary` at regular weight, the count in `text-tertiary`
      at `font-medium`. `border-brand`/`border-brand-100` have no matching `@utility` in this
      codebase (confirmed via grep, 0 hits) - referenced the real `--color-brand-500`/
      `--color-brand-100` `@theme` variables directly via arbitrary-value classes, same "no
      matching utility for a single-use colour" precedent as `tree-view`'s connector line and
      `progress`'s track. The icons themselves also changed to match Figma exactly - `Activity`
      (Events), `Target05` (Occurrences), `Eye` (Observations, already correct), `File06`
      (Resources) - replacing the previous record-type-literal icons (`Calendar`/`ClipboardCheck`/
      `File02`), all four confirmed as real, already-exported `@untitledui/icons` members before
      use. Since Figma's own tiles are plain buttons rather than ARIA tabs, the surrounding
      `<Tabs>`/`<TabPanel>` wrapper (react-aria-components) was dropped in favour of a plain
      `entityTab === "..."` conditional render per `ResultsTable` block - simpler and a more
      accurate match to the source than forcing tab semantics onto a control that isn't one.
    - Verified `tsc --noEmit` and `eslint` clean (also confirmed `File02`, no longer used anywhere
      in the file post-swap, was dropped from the icon import list rather than left dead), then a
      live Chrome pass: searched via "Select a location" (Belair National Park), confirmed the
      "Edit search" link's new position/style, the 4-tile bar's icons/colours/active-state border
      against a side-by-side Figma screenshot, switched all 4 tiles (Events/Occurrences/
      Observations/Resources) and confirmed each swaps its `ResultsTable` correctly, and checked
      both `public-user` and `registered-user` shells - zero console errors either role.
  - **Ninth follow-up: `searchEvents`' mock data (`search-data.ts`) enriched so a broad search
    surfaces 2+ of every event sub-type with real, multi-level Hierarchy chains, matching the
    *density* of the same reference screenshot's example table (not its literal placeholder IDs -
    see the seventh follow-up's own reasoning for why that placeholder chain was never meant to be
    copied verbatim).** Before this pass, Transect/Quadrat/Block/Ramble/Trap/Custom event each had
    exactly one instance in the dataset - Site and Visit already had several. Added one sibling
    instance of each under a different region's existing Site (`trap-ki-1`, `block-naracoorte-1`,
    `ramble-nullarbor-1`, `custom-lake-eyre-1`), plus a second, genuinely 3-level-deep
    Transect → Quadrat chain under Adelaide Hills (`transect-adelaide-1` → `quadrat-adelaide-1`,
    parented under `site-adelaide-2`) alongside the pre-existing Flinders one - so the Hierarchy
    column has two real `Project > Site > Transect` chains to show, not a single example. Every
    new entry follows the same conventions as its siblings (real org names, real SA regions,
    `status`/`statusColor` populated even though the Events table doesn't render them, per the
    type's requirements). No new occurrences/observations/resources were added or repointed to
    the new events - out of scope for this pass, and nothing referenced them before either.
    Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass: selected all 8 southern-SA
    national parks at 96 km radius (53 total records across 8 areas), confirmed Events now breaks
    down as Project 5 / Site 6 / Visit 2 / Transect 2 / Quadrat 2 / Block 2 / Trap 1 (Ramble/Custom
    event stayed at 0 for this specific park selection - `ramble-nullarbor-1`/`custom-lake-eyre-1`
    sit in Nullarbor/Lake Eyre, outside the reach of any of these 8 southern parks, not a bug),
    and specifically confirmed both Quadrat rows render a real 3-segment chain
    (`flinders › site-flinders-1 › transect-flinders-1` and
    `adelaide-hills › site-adelaide-2 › transect-adelaide-1`) - zero console errors.
  - **Tenth follow-up, per direct re-ask to match sizing/spacing/colour exactly and to use Figma's
    own alphanumeric ID format: three real gaps found via `get_design_context` on the actual
    header/body table cells (not just the Metrics section this pass had already covered), all
    fixed - plus one sitewide, previously-undetected dead-CSS bug surfaced along the way.**
    - **Event ID/Hierarchy were showing this build's own internal slug ids (`site-adelaide-2`,
      `transect-flinders-1`, ...), not a real record-ID format at all.** Figma's Event ID column
      (`get_design_context` on the column's own header+cells, e.g. `205:21181`) uses a real short
      alphanumeric code per type - `BD - 5034` (Project), `SU00501` (Site), `VU00501` (Visit),
      `TR00501` (Transect), `QR00501` (Quadrat), `BK00501` (Block), `RMB00501` (Ramble - 3-letter
      prefix, our own data had briefly used a 2-letter `RM`+wrong-number scheme that didn't match
      Figma at all), `TRP00501` (Trap), `CU00501` (Custom event). Added a `code: string` field to
      `SearchEvent` (`search-data.ts`) - `id` stays the internal slug used for parent-linking/React
      keys/routing, `code` is the display-only value. Assigned a real code to all 25 events
      (Projects sequential `BD - 5031`...`5038`, keeping Figma's own `BD - 5034` for the Kangaroo
      Island project as a nice, deliberate coincidence rather than a forced one; every other type
      sequential per-type, e.g. `SU00501`...`SU00509` across the 9 Sites). `eventAncestors`/
      `hierarchyFor` now build their chains from `.code` instead of `.id`, so every Hierarchy cell
      across all 4 tabs (Events' own, plus Occurrences/Observations/Resources via `hierarchyFor`)
      reads in the same real-ID format, not just the Event ID column alone. `eventColumns`' own ID
      cell switched from `e.id` to `e.code`.
    - **The Event ID cell's own text styling was wrong too, caught in the same
      `get_design_context` call** - `font-mono text-sm text-secondary` in code vs. Figma's actual
      `Barlow Regular, text-sm, text-tertiary` (not monospace, not `text-secondary`). Fixed to
      `text-sm text-tertiary`, matching the literal computed style Figma returns for that cell.
      Incidentally caught the same wrong color one column over: the Event/Occurrence/Observation/
      Resource **Type** column's label text was `text-secondary` in all 4 places, Figma's cell
      (`get_design_context` on `205:21215`) confirmed `text-tertiary` - fixed all 4 call sites.
    - **The table header row was rendering as plain, oversized, black text with zero header
      styling at all - a real bug, not a style-precision miss.** `ResultsTable`'s `Table.Header`
      passed the column label as `children` (a bare `<span>{col.label}</span>`), but the real
      `Table.Head` component (`components/application/table/table.tsx`) only applies its
      `text-xs font-semibold text-quaternary` header treatment - and its own tooltip icon - when
      given the `label`/`tooltip` *props*, not children; the manual `children`-based version this
      page had built duplicated the tooltip by hand but never applied the label styling at all.
      Confirmed the real target styling via `get_design_context` on the header cell itself
      (`205:21180`: `Barlow Semibold, text-xs, text-quaternary` = brand's real gray-500 `#8f8b87`,
      exact token match). Fixed by switching to `<Table.Head id={col.id} label={col.label}
      tooltip={col.headerTooltip} .../>` - the real component's own built-in props - rather than
      re-deriving the same styling a second time by hand. Dropped the now-unused `HelpCircle`
      import from `results-table.tsx` as a result.
    - **A real, sitewide, previously-undetected dead-CSS bug: `bg-border-secondary` (the row/
      header divider line's background colour, in both `components/application/table/table.tsx`
      and `components/base/table/table.tsx`, 2 occurrences each) was never a real Tailwind
      utility** - only `border-secondary` (a `border-color` utility) exists in `app/globals.css`;
      nothing defines a `bg-` version, confirmed via grep and via the actual compiled CSS output
      (0 hits for the class, `.border-secondary` present). Every table row/header border in this
      codebase was rendering as a fully transparent 1px line - a table with zero visible separator
      lines between rows, silently, everywhere `Table`/`TableCard` is used (the `/components/table`
      doc page, `project-list-content.tsx`, `project-detail/option-1`, `project-list/option-2`,
      the map search results table, and 4 more consumers - see `grep -rl` for the full list). Same
      failure mode as `tree-view`'s connector line and the earlier `progress`-bar track fix - a
      plausible-sounding class with no matching hand-curated `@utility` rule. Fixed all 4
      occurrences to `bg-[var(--ui-border-secondary)]`, the same "reference the real CSS variable
      directly" precedent used every other time this bug shape has surfaced. Verified live on both
      this page and the unrelated `/components/table` doc page - row divider lines are now visibly
      present on both, zero console errors either page.
    - **A third, denser `Table` size added, matching Figma's own dense results-table row/header
      metrics exactly, rather than settling for the closest of the two existing sizes.** Figma's
      spec (from the header/body cell fetches above): a 34px header row, a 44px body row, 12px
      horizontal / 8px vertical cell padding - none of which the existing `"sm"` (36px/56px,
      20px/12px) or `"md"` (44px/72px, 24px/16px) sizes matched closely enough to call "exact".
      Added `size="xs"` as a genuine, reusable third option on the real `Table`/`TableCard`
      components (`TableContext`'s type, `TableCardRoot`, `TableHeader`, `TableHead` - which
      previously had *no* size-aware padding branch at all, always `px-6 py-2` regardless of
      `size` - `TableRow`, `TableCell`), documented with a comment on `TableContext` pointing back
      at this exact Figma node, so any future page needing this same dense pattern reaches for it
      instead of re-deriving the same pixel values inline. `ResultsTable` now passes `size="xs"`
      on `TableCard.Root` specifically (not just the inner `<Table>`) - `TableRoot`'s own context
      provider prefers an ancestor's size over its own `size` prop (`context?.size ?? size`), so
      `TableCard.Root`'s default `"md"` would otherwise silently win over a `size="xs"` passed only
      to the nested `<Table>`, a real footgun worth documenting inline for the next consumer.
    - Verified `tsc --noEmit`/`eslint` clean on every touched file, then a live Chrome pass:
      searched Belair + Flinders Chase at 80km (24 records), zoomed into the header row and first 4
      body rows side-by-side against Figma's own screenshot (header text now small/gray/semibold
      matching exactly, row divider lines now visible, Event ID column showing real `BD - 5031`/
      `SU00501`-style codes), confirmed a 3-level Hierarchy chain renders in the same code format
      (`BD - 5031 › SU00502 › TR00502`), confirmed the Hierarchy dropdown still opens/functions,
      checked the Occurrences tab's own `hierarchyFor`-driven chain (`BD - 5031 › SU00501 ›
      VU00501`), and spot-checked the unrelated `/components/table` doc page to confirm the
      sitewide border-colour fix improved rather than broke every other `Table` consumer - zero
      console errors across every page checked.
  - **Eleventh follow-up, per direct clarification of the Hierarchy cell's exact intended
    behaviour (the previous rounds had it show every ancestor by default and never include the
    row's own Event, neither of which was ever explicitly specified before this): the chain's own
    last segment is always the row's own Event ID, exactly one level is visible by default, and
    every visible segment - including every ancestor, not just the "..." trigger - opens that
    specific ancestor Event's own detail panel.**
    - **`eventAncestors`/`hierarchyFor` (search-data.ts) now return `SearchEvent[]` (full ancestor
      Event objects), not `string[]` codes** - a Hierarchy segment needs to open its own detail
      panel, which needs the full record, not just a display string. Added `eventChain(event)` -
      `[...eventAncestors(event), event]`, i.e. every ancestor *plus the event itself* as the
      always-present final segment - used by the Events tab's own Hierarchy column in place of the
      bare `eventAncestors(e)` it called before (which never included the row's own Event at all,
      the actual gap this round fixes). `hierarchyFor` already ended at the record's immediate
      parent Event (unchanged in spirit, just returning the object now instead of its code).
    - **`eventTypeIcon` moved from `page.tsx` into `search-data.ts` (and is now exported) so
      `HierarchyCell`'s own detail panel can show the same per-type icon the main Type column
      does**, rather than duplicating the same `Record<EventType, Icon>` map in two files -
      `page.tsx` now imports it instead of defining its own copy. `EventType`'s now-unused import
      dropped from `page.tsx`, and `MarkerPin01`/`Send01`/`Grid03`/`LayoutGrid01`/`Crop01`/
      `Shuffle01`/`NavigationPointer01` dropped from its icon imports (only used by that map);
      `Circle`/`Folder` stayed, both still used elsewhere on the page.
    - **`HierarchyCell` (results-table.tsx) rewritten**: `chain` is now `SearchEvent[]`.
      `hiddenCount` defaults to `chain.length - 1` (collapsed to just the one always-shown level,
      not `0`/fully-expanded as before) and is clamped at that same `chain.length - 1` maximum
      (previously `chain.length`, which could hide every segment including the row's own ID) -
      "Hide one level up"/"Hide all levels" now disable correctly once only that one level
      remains, matching "always one level will be shown which is the same as the respective event
      ID" exactly. Every visible segment (ancestors *and* the row's own final segment alike) is
      now a real `<button>`, not inert styled text - clicking one opens a second `SidePanel`
      (self-contained per `HierarchyCell` instance, independent of `ResultsTable`'s own row-detail
      panel) showing that specific ancestor's Event ID/Name/Type-with-icon/Start/End Date/its own
      Hierarchy (rendered as plain breadcrumb text there, not recursively interactive - avoids
      unbounded nested-panel complexity while still surfacing the information). React-aria's
      `ModalOverlay` handles two panels open at once (e.g. opening a Hierarchy segment's panel from
      *inside* the row-detail panel, since the Events tab's own row-detail view also renders a
      `HierarchyCell` for its Hierarchy field) without extra wiring - confirmed no dismiss/stacking
      issues live.
    - Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass: searched Belair National
      Park (14 records), confirmed every Events row defaults to showing exactly one segment equal
      to its own Event ID (`SU00501`, `VU00501`, `TR00502`, `QR00502`), "Show one level up" on the
      Quadrat row revealed exactly one more ancestor (`TR00502 › QR00502`), clicking that `TR00502`
      segment opened a real side panel with the Transect's own ID/Name/Type/dates/Hierarchy,
      "Show all levels" revealed the complete `BD - 5031 › SU00502 › TR00502 › QR00502` chain, and
      the Occurrences tab's own `hierarchyFor`-driven cells defaulted to the same one-level-only
      behaviour (`VU00501`, `SU00502`) - zero console errors throughout.
  - **Twelfth follow-up: two changes, one a real layout bug fix, one a business-driven IA reversal
    confirmed against a fresh Figma node.**
    - **The selected metrics tile shifted vertically by ~1px on selection - a real bug, not a style
      nit, flagged directly by the user off a screenshot.** Root cause: the active/inactive states
      toggled real border *width*, not just colour - inactive was a full 1px border on all 4 sides,
      active dropped top/left/right to 0px and used only a 1.5px bottom border, so the two states
      had different total vertical border height and the button's own box (everything inside it)
      physically moved when switching. Fixed with the standard technique for this exact tab-bug
      class: every tile now keeps an identical 1px border box at all times regardless of state
      (`border` + conditional `border-transparent`/`border-[var(--color-brand-100)]`, width never
      changes) and the visible active "underline" is a separate `absolute inset-x-0 -bottom-px
      h-[1.5px]` bar layered on top - out of normal flow entirely, so it can never affect the
      button's own box height. Verified live: zoomed into the identical pixel region across all 5
      tabs (Projects/Events/Occurrences/Observations/Resources active in turn) and confirmed the
      label/count text sits at the exact same vertical position in every state, pixel for pixel.
    - **Projects split back out into its own top-level tab, ahead of Events - reversing the
      "Projects folded into Events" decision from earlier in this build, per direct business
      feedback and a fresh Figma reference** (`get_design_context`/`get_screenshot` on node
      `209:27950`, the same file's landing-page - 5 tiles now, Folder/Activity/Target05/Eye/File06,
      Projects first). The underlying data model is untouched - a Project is still internally an
      `Event` (`type: "Project"` in search-data.ts) - only which tab a Project-type row surfaces in
      changed. `EntityTab` gained `"projects"` (first in the union and in `entityTabs`, matching
      Figma's own left-to-right order); `filteredAllEvents` (the original spatial+keyword pass over
      `searchEvents`) now splits into `filteredProjects` (`type === "Project"`) and `filteredEvents`
      (everything else) so a Project is counted and shown in exactly one tab, never both and never
      neither. `eventTypeOptions` (the Events tab's own sub-filter chips) dropped `"Project"` from
      its list, since that type can no longer appear there. Default `entityTab` state and
      `runSearch()`'s post-search tab both changed from `"events"` to `"projects"`, matching Figma's
      new primary/leftmost position. Added a dedicated `projectColumns` (Project ID/Project Name/
      Organisation/Start Date/End Date/Hierarchy) rather than reusing `eventColumns` as-is - dropped
      the redundant "Type" column (every row is a Project) and added "Organisation" in its place, a
      real field (`SearchEvent.org`) with nowhere else to surface once Type was removed; no
      `typeField`/`typeOptions` passed to the Projects `ResultsTable` either, since a single-type
      table has no real sub-type to filter by chip. Verified `tsc --noEmit`/`eslint` clean, then a
      live Chrome pass: searched Belair + Deep Creek (14 records), confirmed Projects renders first
      and active by default with its own real columns (`BD - 5031`/Adelaide Hills Bushland Survey/
      Adelaide Hills Landcare), confirmed Events' own count (5) no longer includes the Project row,
      confirmed the row-detail side panel opens correctly for a Project row with the new column set
      - zero console errors.
  - **Thirteenth follow-up: the sub-type filter chip row's own icons and "badge" styling were
    never actually checked against Figma directly - they were built from a screenshot squint plus
    the real `Button` component's secondary/tertiary colours, and both turned out wrong once the
    chip row's own node was fetched. Fixed, plus one data gap (no Ramble reachable from any of the
    8 real national parks) closed.**
    - **5 of 9 event-type icons were the wrong glyph entirely - a screenshot-inferred guess, not
      confirmed against the real component.** `get_design_context` on the chip row itself
      (`I205:21340;195:10229;1396:59991;195:9701`) gave the real icon names straight from Figma's
      own generated code: Site is `MarkerPin04` (was `MarkerPin01`), Transect is `GridDotsBottom`
      (was `Grid03`), Quadrat is `LayoutGrid02` (was `LayoutGrid01`), Block is `Scan` (was `Crop01`),
      Trap is `CursorClick01` (was `NavigationPointer01`) - Project/Visit/Ramble/Custom event
      (`Folder`/`Send01`/`Shuffle01`/`Circle`) were already correct. `eventTypeIcon`
      (search-data.ts) is the one shared source for this map, so fixing it there corrected the
      Type column, the chip row, and the Hierarchy cell's own per-segment detail panel all at once.
      All 5 replacement icons confirmed as real, exported `@untitledui/icons` members before use.
    - **The chip row itself was built from the real `Button` component's `secondary`/`tertiary`
      colour variants - neither actually matches Figma's bespoke chip styling.** Figma's own frame
      shows a distinct pattern with no equivalent `Button` variant: selected = a boxed pill
      (`bg-primary_alt`, `border-primary`, `shadow-xs`, `rounded-md`, 36px tall), unselected = no
      box at all (`rounded-sm`, no border/background) - both states Barlow **Semibold** at all
      times (only colour changes between `text-brand-secondary` and `text-quaternary`, weight
      never does, confirmed directly from the fetched node rather than assumed). Rebuilt as a
      bespoke `<button>` per chip (not `Button`) using those exact tokens, following this file's
      own "no DEW component patched, no Scaffold-from-Button substitute - build honestly from
      tokens when nothing real matches" precedent. The count itself is a real "Badge" instance in
      Figma (`bg`/`border`/`text` = `utility-neutral-50`/`200`/`700`, the same trio this codebase's
      own `CountBadge` component already uses for this exact purpose) - built inline rather than
      via `CountBadge` since that component is a fixed `size-5` circle with no border, while
      Figma's version is a content-width pill *with* a border - a real, if small, shape difference
      worth keeping accurate rather than reaching for the near-but-not-quite match. `Button` import
      dropped from `results-table.tsx` as a result (no longer used anywhere in the file).
    - **A real, previously-unnoticed data gap: neither existing Ramble event
      (`ramble-lake-eyre-1`/`ramble-nullarbor-1`) sits anywhere near any of the 8 real national
      parks this page's own "Select a location" list offers**, so a realistic search - as the user's
      own screenshot showed - always read "Ramble 0," never actually demonstrating that sub-type.
      Added `ramble-flinders-1` (`RMB00503`) as a second child under the existing `site-flinders-1`
      (a sibling of `transect-flinders-1`), squarely inside Flinders Ranges National Park's own
      reach - a real, working example of every one of the 9 event sub-types is now reachable from
      at least one of the 8 listed parks.
    - Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass: searched Flinders Ranges
      National Park alone at 50km, confirmed all 4 event types present (Site/Transect/Quadrat/
      Ramble, including the new `RMB00503` row) with every chip showing its correct new icon and
      the exact boxed-pill/plain-text selected/unselected treatment, confirmed clicking a chip
      correctly toggles the selected styling, and confirmed the Type column's own icon (Site's
      `MarkerPin04`) updated to match - zero console errors.
  - **Fourteenth follow-up: the metrics tab row was still shifting both horizontally and
    vertically on tab click, flagged again off a fresh screenshot - a genuinely different root
    cause from the per-tile border-width bug fixed two rounds earlier (that fix is still correct
    and still in place; this was a second, separate bug with the same visible symptom).** Root
    cause: the scrollable `<main>` (`overflow-y-auto`) wraps both the metrics tab row *and* the
    table content below it, and different tabs hold very different row counts (e.g. Events 16 vs
    Resources 9 in the same search) - so some tabs need a vertical scrollbar and others don't.
    Without reserving that scrollbar's width unconditionally, its gutter appearing/disappearing on
    tab switch changed the actual content width available to *everything* inside `<main>`,
    including the tab row sitting at the very top of it - shifting it horizontally, and, once the
    narrower width made the longest label ("Custom event") borderline enough to occasionally wrap
    onto a second line, its height too (the vertical symptom). Fixed with the standard, single-line
    remedy for exactly this class of bug: `[scrollbar-gutter:stable]` on the `<main>` element,
    reserving the scrollbar's space at all times regardless of whether the current tab's content
    actually needs to scroll, via Tailwind's arbitrary-property syntax (no existing utility for
    this CSS property). Verified live: searched 7 national parks at 96 km (54 records - Projects 5/
    Events 16/Occurrences 12/Observations 12/Resources 9, a real spread from "fits without
    scrolling" to "needs a scrollbar"), zoomed into the identical pixel region of the tab row across
    Projects → Events → Occurrences and confirmed the label/count text sits at the exact same
    position in every state - zero console errors.
  - **Fifteenth follow-up: the sub-type filter chip row (All/Site/Visit/.../Custom event) had the
    exact same shift bug as the metrics tab row, flagged directly off a screenshot of this row
    specifically - a real gap in the thirteenth follow-up's own rebuild, which faithfully copied
    Figma's chip styling including the part that causes the bug.** Figma's own selected chip is
    literally a bigger box than its unselected one (selected: `h-9 rounded-md border px-3 py-2`;
    unselected: no border, `rounded-sm px-2 py-1`, no fixed height) - copying that literally means
    every chip's own box changes size the instant it's selected, which reflows every chip after it
    in the row and can change the row's own height, identical to the metrics tab row's border-width
    bug two rounds earlier. Fixed the same way: every chip (`results-table.tsx`) now keeps the
    *same* box model at all times - `h-9 rounded-md border px-3 py-2`, unconditionally, for both
    "All" and every per-type chip - and only toggles what doesn't affect layout (border colour
    `border-primary`/`border-transparent`, background `bg-primary_alt`/none, text colour, and
    `shadow-xs`). A deliberate, small visual departure from Figma's own inconsistent-box-size
    version, same trade-off already made and accepted for the metrics tab row - reserving the
    larger "selected" footprint for every chip, not just the active one, is what prevents the
    reflow. Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass: searched Flinders
    Ranges National Park at 50 km, zoomed into the identical pixel region of the chip row before and
    after clicking "Site" and confirmed every chip after it (Visit/Transect/Quadrat/Block/Ramble/
    Trap) sits at the exact same horizontal position in both states, and confirmed the filter itself
    still works (selecting "Site" correctly narrowed the table to just the one Site row) - zero
    console errors.
  - **Sixteenth follow-up: two related asks - constrain the whole page to viewport height with the
    map search results table scrolling internally instead of growing the page taller, and build
    the real numbered-pagination footer (previously logged as "a bigger, separate component, not
    built speculatively") once the user supplied its own Figma node to match exactly.**
    - **Real, working internal scroll**, not just a style tweak: the map search results page's
      `<main>` (`overflow-y-auto`) used to be the whole page's own scroll container, so a tab with
      many rows made the *entire page* - search box, chip row, tabs, table - scroll together,
      pushing the toolbar off-screen. Fixed by making `<main>` stop scrolling itself in results
      mode (`overflow-hidden` - search/map mode keeps its existing `overflow-y-auto
      [scrollbar-gutter:stable]` unchanged, gated on `displayMode`) and instead flowing a bounded
      height down through the component tree via `flex ... min-h-0` at each level (the results
      container, the `<div>` wrapping `ResultsTable`, `ResultsTable`'s own root, `TableCard.Root`),
      with every toolbar piece (`SectionHeader`, the Level 1/2 note, the metrics tile row, the chip
      row, the search box) marked `shrink-0` so only the actual table region absorbs the remaining
      space and scrolls.
    - **Extended the real `Table`/`TableCard` components with two new, additive, opt-in props**
      rather than changing their default behaviour for the ~10 other pages that already use them:
      `Table`'s `bodyScrollable` (its wrapper div becomes `min-h-0 flex-1 overflow-y-auto` in
      addition to its existing `overflow-x-auto`, instead of just growing to full content height)
      and `Table.Header`'s `sticky` (`sticky top-0 z-10`, so column labels stay visible above the
      scrolling rows). Both default to `false`/unset, so every existing consumer (the `/components/
      table` doc page, `project-list-content.tsx`, `project-detail/option-1`, etc.) keeps its
      current "grows with content, page scrolls" behaviour unchanged - confirmed live on the doc
      page specifically, zero visual or console difference.
    - **Built `TableCard.PaginationNumbered`**, matching Figma's own reference exactly
      (`get_design_context` on `I205:21340;195:10229;1396:59991;1:84675`, supplied directly this
      round): "Rows per page [50 ▾] | ← Previous | 1 2 3 … 8 9 10 | Next → | 1-50 of 250". Added as
      a genuinely separate component alongside the existing `TableCardPagination` (the simple
      "Page X of Y" version) rather than replacing it - every one of that simple version's 5
      existing consumers keeps working unchanged. The page-number list (`tableCardPaginationRange`,
      exported for reuse) always shows the first 3 and last 3 pages with one ellipsis gap between,
      matching Figma's own "1 2 3 … 8 9 10" example precisely, inserting the current page with
      ellipses on both sides only when it falls outside those fixed boundaries. The "Rows per page"
      control is a small native `<select>` built from raw tokens (`border-primary`, `rounded-xs`,
      `text-tertiary`) rather than the real `NativeSelect` component - that component's own default
      styling (rounded-lg, shadow-xs, ring-1, text-md) is sized for a real form field, not this
      compact inline control, and overriding that much of its baked-in styling would fight the
      component more than reuse it. Colours confirmed exact matches to already-real tokens from the
      fetch itself: current-page background `bg-primary_hover` = gray-50 = `#f8f8f7`, active/
      inactive text `text-secondary`/`text-quaternary` = gray-700/`#585451` and gray-500/`#8f8b87`
      respectively - all already-defined tokens, nothing invented.
    - **`ResultsTable` now paginates for real**, not cosmetically - `page`/`pageSize` state (default
      50, matching Figma), `pagedRows` sliced from `filteredRows` and passed to `Table.Body` in
      place of the full filtered set, `currentPage` clamped down via `Math.min(page, pageCount)` if
      a filter/page-size change shrinks the result set out from under whatever page the user was on
      (derived at render time, not reset via a `useEffect`, consistent with this codebase's existing
      avoidance of the "setState in effect" cascading-render pattern), and the type-filter/search/
      page-size setters each reset `page` to 1 directly (not via effect either) so narrowing a
      filter always lands back on page 1.
    - Verified `tsc --noEmit`/`eslint` clean on every touched file, then a live Chrome pass:
      searched 7 national parks at 96 km (54 records), confirmed the whole page fits the viewport
      with no page-level scrollbar and the pagination footer stays fixed at the bottom on every tab
      (Projects 5 rows / Events 16 rows / Occurrences 12 rows), scrolled inside the Events table and
      confirmed only the body rows moved while the sticky header, chip row, search box, and
      pagination footer all stayed exactly in place, changed "Rows per page" to 10 (via a real
      `change` event, since headless-Chrome automation doesn't reliably drive a native `<select>`'s
      OS-level popover) and confirmed the table correctly re-paginated to "1-10 of 16" with a real
      page 2 reachable and showing the remaining 6 rows, and spot-checked the unrelated `/components/
      table` doc page to confirm the new opt-in props changed nothing there - zero console errors
      anywhere.
  - **Seventeenth follow-up, per inline page feedback on `public-user` specifically: the viewport-
    height/internal-scroll fix from the sixteenth follow-up re-verified as still correct (no code
    change needed), plus two real fixes - the Occurrence/Observation sub-type chip icons and the
    Hierarchy cell's click/default-depth behaviour.**
    - **Viewport-height/internal scroll re-verified, not regressed.** The feedback flagged the
      results table growing past the viewport again - re-tested at the exact reported viewport
      (1792×1120) as `public-user` with a 16-row Events search: `document.documentElement.
      scrollHeight` and `window.innerHeight` matched exactly (both 1120), and scrolling inside the
      table moved only the body rows while the toolbar/pagination stayed fixed. The sixteenth
      follow-up's fix (`<main>`'s `overflow-hidden` in results mode, `Table`'s `bodyScrollable`/
      `sticky` props) already covers this correctly - the feedback was most likely captured against
      a pre-fix state, or from a session that hadn't reloaded past that fix. No code change made.
    - **`occurrenceTypeIcon` (`app/pages/observations/option-1/page.tsx`, shared by the Occurrences
      and Observations tabs' Type column and sub-type chip row) had 2 of its 4 icons wrong -
      confirmed directly against a freshly-supplied Figma node (`215:28069`, same landing-page
      file), not just re-trusted from the earlier eighth-follow-up screenshot read.
      `get_design_context` on the chip row itself (`I195:15188;195:10266;1396:60338;195:9855`)
      showed Individual's real icon is the "layer-single" DS - Foundations component (a single
      flattened layer outline) and Population's is "layers-three-01" (three stacked layers) - real,
      exported `@untitledui/icons` members `LayerSingle`/`LayersThree01`, confirmed present in
      `node_modules/@untitledui/icons/dist/` and in the package's own export list before use. The
      previously-shipped `CircleCut`/`LayersTwo02` were a screenshot-inferred guess from a lower-
      resolution render, wrong on both counts. Non-Biotic (`Waves`)/Community (`Users01`) weren't
      present in this particular frame's own mock data (0/1 count, chips not rendered in the
      screenshot) - left unchanged since no counter-evidence surfaced; `search_design_system`
      confirmed real "waves" and "users-01" DS - Foundations components exist in this file's
      library, consistent with those two already being correct.
    - **`HierarchyCell` (`app/pages/_shared/map-search/results-table.tsx`) changed on two points,
      per direct feedback: "always the last item in the hierarchy is not clickable. By default show
      atleast one level up."** Read as a UX spec, not a bug report on broken current behaviour (a
      live test confirmed every segment, including the last, already opened its detail panel
      correctly before this change) - the ask is that the record's own segment (always the chain's
      last entry) should be plain, non-interactive text rather than a link, since it's already fully
      inspectable via the row itself (click-to-open, or its own ID column) and a second identical-
      looking link for it is redundant; and that the *default* collapsed state should always surface
      at least one real, clickable ancestor rather than requiring "Show one level up" before any
      link appears at all. Implemented as: the last element of `visible` (always the chain's own
      final/record entry, since `hiddenCount` only trims from the front) renders as
      `<span className="text-sm font-medium text-secondary">`, no `onClick`, instead of the
      brand-coloured button every other visible segment still uses; and `hiddenCount`'s initial
      state changed from `maxHidden` (`chain.length - 1`, showing just the one non-clickable level)
      to `Math.max(0, chain.length - 2)` (showing the last two levels - one real ancestor link plus
      the record itself). Applies uniformly to Events (`eventChain`), Occurrences and Observations
      (`hierarchyFor`) - all three route through this one shared component, so no per-tab branching
      was needed. The "Show one level up"/"Hide one level up"/"Show all levels"/"Hide all levels"
      dropdown actions and their disabled-state logic were untouched - they already worked in terms
      of `hiddenCount`/`maxHidden`, which still behave correctly under the new default.
    - Verified `tsc --noEmit`/`eslint` clean on both touched files, then a live Chrome pass as
      `public-user`: searched Belair National Park at 96 km (14 records), confirmed the Occurrences
      tab's Individual/Population chips now show the corrected icons, confirmed a 2-level Occurrence
      row (`SU00501 › VU00501`) defaults to both segments visible with `SU00501` a real clickable
      teal link (opened its own "Cleland Bushland Site" detail panel on click, confirmed) and
      `VU00501` plain gray text that does nothing when clicked (no panel opened, no row action
      fired) - zero console errors throughout.
  - **Eighteenth follow-up: the Projects tab's own columns changed to match the real Projects page
    (`app/pages/_shared/project-list-content.tsx`) exactly, per direct feedback with a screenshot of
    that page's own table for reference.** Was Project ID/Project Name/Organisation/Start Date/End
    Date/Hierarchy - the same Event-shaped column set every other tab here uses, which never matched
    the real Projects page's own Project/Organisation/Status/Contributor/Updated columns even though
    a Project-type row here *is* the same underlying project (see the twelfth follow-up's "Projects
    is a leaf with its own key" split). Root Projects have no meaningful Hierarchy (always "-") and
    the reference table has no Project ID/Start Date/End Date columns at all, so those were dropped
    rather than kept as extra hidden options - a straight match, not a superset.
    - `SearchEvent` (`search-data.ts`) gained 4 optional fields - `contributorInitials`,
      `contributorName`, `updated`, `description` - only ever populated on a `type: "Project"` row
      (every other event type has no real equivalent data, left `undefined`). `myProjectEvents`
      pulls them straight from `myProjects` (`project-list-content.tsx`) instead of re-typing them -
      same underlying project, same real values. `otherProjectEvents`' 4 rows (Naracoorte/Lake Eyre/
      Nullarbor/Mount Remarkable) got real values added: a one-line description matching each
      project's own name/status, and a contributor drawn from this file's own already-established
      placeholder persona set (Olivia Wyatt/Maya Dewitt/Phoenix Baker/Lana Steiner) - never a newly
      invented name.
    - `projectColumns` (`app/pages/observations/option-1/page.tsx`) rebuilt to the reference's exact
      5 columns and cell treatments: Project (name + truncated description, matching
      `project-list-content.tsx`'s own `flex-col gap-0.5` stack), Organisation (`text-secondary`),
      Status (a real `Badge` in `e.statusColor`, same `pill-color` default type as the reference),
      Contributor (`Avatar size="xs"` + name, a plain "-" fallback for the theoretical case of a
      missing contributor), Updated. Added a `Badge` import (`Avatar` was already imported).
    - Verified `tsc --noEmit`/`eslint` clean on both touched files, then a live Chrome pass:
      searched -34.93, 138.60 at 296 km (43 records, 4 projects), confirmed all 4 Project rows
      render with the correct status colours (green Active, amber Under review, blue Completed) and
      contributor avatars/names, and confirmed the row-detail side panel (which renders every
      column, not just the visible set) also reflects the new 5-field shape correctly - zero console
      errors.
  - **Nineteenth follow-up: Draft/Under review projects excluded from the Projects tab's own
    results, per direct feedback ("There cannot be drafts and under review projects [in the
    results]").** Not a data change - `myProjects`' and `otherProjectEvents`' own status values are
    untouched, so the real Projects page (`project-list/option-1`, built on the same
    `project-list-content.tsx`) still correctly shows a project's true lifecycle state, Draft/Under
    review included, for the user's own project-management purposes. Instead, `filteredProjects`
    (`app/pages/observations/option-1/page.tsx`) now also requires `e.status === "Active" ||
    e.status === "Completed"` - same precedent already established for `featuredProjects` in
    `app/pages/_shared/home-dashboard.tsx` ("neither is published/verified yet, so neither belongs
    in [a results/discovery context]"), applied here to a public-facing search results list for the
    same reason. A hidden project's own child Events/Occurrences/Observations are *not* cascaded out
    - `eventAncestors`/`eventChain`/`hierarchyFor` look up `searchEvents` directly (unfiltered), so
    the Hierarchy column still resolves a real chain back to a hidden project's own code if a child
    record surfaces in another tab; only the project's own row disappears from the Projects tab and
    its count. Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass: searched -34.93,
    138.60 at 296 km - Projects count dropped from 4 to 3 (Coorong Wetlands Bird Count, "Under
    review", no longer listed) and the total record count dropped from 43 to 42 to match, while the
    remaining 3 rows (Adelaide Hills, Kangaroo Island, Mount Remarkable) show only Active/Completed
    badges - zero console errors.
  - **Twentieth follow-up: a pinned "View Project" column added to the Projects tab, per direct
    request for "a floating fixed column to the right that will stay fixed on horizontal scroll"
    with a "View Project" text button per row.** Built as a real, reusable primitive on
    `ResultsTable` itself (`app/pages/_shared/map-search/results-table.tsx`), not a one-off hack
    scoped to the Projects tab's own markup, since any future tab could need the same pattern.
    - `ColumnDef<T>` gained optional `headerClassName`/`cellClassName`, merged onto that column's
      `Table.Head`/`Table.Cell` - the general mechanism a pinned column needs (`sticky right-0`),
      not specific to "view actions".
    - `ResultsTable` gained an optional `viewActionLabel` prop. When set, a synthetic column
      (`VIEW_ACTION_COLUMN_ID = "__view_action__"`) is appended *after* `visibleColumns` when
      building the array passed to `Table.Header`/`Table.Row` - deliberately never part of the
      caller's own `columns` prop, so it can't be hidden via "Customise columns" (which iterates
      `columns` directly) and doesn't appear as a field in the row-detail side panel (same). Each
      cell renders a real `Button color="link-color" size="sm"` with the given label, wrapped in a
      plain `<div onClick={(e) => e.stopPropagation()}>` - same defensive pattern `HierarchyCell`'s
      own buttons already use in this file - so pressing it doesn't also fire the row's own
      `onAction` a second time.
    - **The button opens the same row-detail `SidePanel` a row click already does, rather than
      attempting real per-row navigation.** Only one project in this whole build has a real detail
      page (`/pages/project-detail/option-1`, wired to "Adelaide Hills Bushland Survey" specifically
      via `project-list-content.tsx`'s own `href` field) - routing every other project's "View
      Project" to that same one page would misrepresent a different project as if it were that
      specific example, the same "no match, no substitute" call already made elsewhere in this file
      (e.g. the Hierarchy dropdown, the numbered-pagination scope). Reusing the existing, already-
      real detail panel keeps the action honest and consistent across every row instead of forking
      behaviour per row based on which one happens to have a real page.
    - Sticky styling: header cell `sticky right-0 z-10 border-l border-secondary bg-secondary`
      (matches the header row's own background), body cell `sticky right-0 z-10 border-l
      border-secondary bg-primary` - a sticky cell needs its own opaque background or the columns
      scrolling underneath show through, confirmed necessary and correct via computed style (not
      assumed). Wired into the Projects `<ResultsTable>` call in `app/pages/observations/option-1/
      page.tsx` via `viewActionLabel="View Project"`; no other tab passes this prop, so no other
      tab's table changed shape.
    - Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass: confirmed via
      `getComputedStyle` that both the header cell (`aria-label="Actions"` on the column, matching
      `role="columnheader"`) and every body cell in that column compute `position: sticky; right:
      0px` with the expected background/border, and that clicking "View Project" opens the exact
      same detail panel a row click opens, in one click (no double-fire) - zero console errors.
  - **Twenty-first follow-up: a real data-integrity bug fixed, per direct feedback with a
    screenshot - "if there are 20 events shown, it means that the 20 events are somehow linked to
    the projects that are fetched as results," and every Occurrence/Observation/Artefact the same
    way, per the real Project -> Event -> Occurrence -> Observation hierarchy (see "BDBSA domain
    research" above) - plus the Resources tab renamed "Artefacts and Attachments."** The
    screenshot itself proved the bug: an Events search returned rows under 3 different project
    codes (`BD - 5032` Coorong, `BD - 5037` Nullarbor, `BD - 5038` Mount Remarkable) while the
    Projects tab showed only 1 - because every tab filtered its own dataset independently by its
    own record's lat/lon, with no requirement that a shown child's own root Project also be one of
    the Projects shown. A Project with an "Under review"/Draft status (already excluded from the
    Projects tab, per the nineteenth follow-up above) could still have its child Events/
    Occurrences/Observations/Resources shown, orphaned from any visible parent.
    - **`rootProjectOfEvent`/`rootProjectForParentEventId`** added to `search-data.ts` - the first
      walks an Event's own ancestor chain (via the already-real `eventAncestors`) up to its root
      Project (or returns itself if it already is one); the second does the same starting from an
      Occurrence/Observation/Resource's own `parentEventId`.
    - **`app/pages/observations/option-1/page.tsx`'s filtering rewritten as two passes.** (1)
      `matchingProjectIds` - a Project qualifies if it, or ANY of its descendants, spatially +
      keyword matches (a roll-up match, since a Project is a container, not a single point on the
      map), AND its own status is published (Active/Completed - same exclusion as before,
      **now cascading**: excluding a Project here also excludes every one of its descendants from
      every other tab, rather than leaving them shown with no visible parent). (2) Each of
      Projects/Events/Occurrences/Observations/Resources then shows only records that both
      spatially + keyword match *and* belong to a Project in `matchingProjectIds` - replacing the
      old single `filteredAllEvents` pass that split Projects/Events from one dataset with no
      cross-check against the other three record types at all.
    - **Resources tab relabelled "Artefacts and Attachments"** (`entityTabs`, the `ResultsTable`'s
      `ariaLabel`/`emptyLabel`) per direct feedback - it holds every file/image/reference link
      attached to an individual Event/Occurrence/Observation record, and "Resources" read as
      ambiguous with a project's own resourcing. The internal `EntityTab` id/data model
      (`"resources"`, `searchResources`, `resourceColumns`, etc.) is unchanged - label only.
    - Verified `tsc --noEmit`/`eslint` clean, then a live Chrome pass reproducing the exact
      screenshot scenario (Coorong + Mount Remarkable + Nullarbor National Parks, 15km): Projects
      correctly dropped to 1 (Mount Remarkable Malleefowl Program, Active - Coorong Wetlands Bird
      Count and Nullarbor Arid Zone Monitoring are both "Under review," now correctly excluded
      end-to-end), and Events/Occurrences/Observations/Artefacts and Attachments each dropped to
      exactly the Mount Remarkable-linked subset (2/2/2/1, summing with the 1 Project to the
      "8 records found" total) - every visible Hierarchy chain traces to `BD - 5038`, the one
      Project shown. A second, wider pass (8 parks at 40km, registered-user) returned 5 published
      Projects and confirmed all 15 Events/9 Occurrences/9 Observations/7 Artefacts (45 total,
      matching the tiles' own sum) trace only to those 5 Projects' own codes, with zero rows under
      the two excluded (Coorong/Nullarbor) codes - zero console errors either pass.
  - **Twenty-second follow-up: a real, Figma-matched record-detail sidebar - built from a second
    Figma frame the user supplied specifically for this** (`https://www.figma.com/design/
    u4FTv88XXfy58MiLN5T5Wu/Home---Landing-Page?node-id=220-52656`), replacing the generic column-
    detail `SidePanel` (a flat label/value `dl`) that a Projects/Events/Occurrences/Observations
    row click used to open. Per direct request: clicking any Project/Site/Visit/.../Occurrence/
    Observation row opens a real accordion sidebar matching that record type's own Figma "Details
    Container" frame, every section independently expandable, a header icon to expand/collapse
    every section at once, the sidebar itself pinned to the full viewport height with its content
    scrolling internally (Resources/Artefacts are deliberately excluded - no Figma frame documents
    a resource sidebar, and the request named "project, event, occurrence and observation" only).
    - **All 15 "Details Container" frames read directly via `get_design_context`** (`get_metadata`
      first, to enumerate them: Project/Site/Visit/Transect/Quadrat/Block/Ramble/Trap/Custom
      event/Occurrence Individual/Occurrence Population/Observation Individual/Observation
      Population/Observation Non-Biotic/Observation Community) - Project's own frame (11 accordion
      sections) was too large for a single call and needed one call per accordion; every other
      frame fit as one call each. Confirmed directly, not inferred: Visit, Transect, and Quadrat
      are byte-for-byte the same 6-accordion template (`{Type} Details` -> Temporal Details ->
      Observers -> Location Information -> Photopoint -> Custom Property), differing only by the
      type name interpolated into each label - Block/Ramble/Trap/Custom event follow that
      confirmed template without needing their own separate fetch, given the flawless repetition
      already demonstrated three times running. Site is the one real exception (root spatial
      record, not a child location) - no Temporal Details accordion, and its own Location
      Information carries a full Zone/Easting/Northing/Latitude/Longitude Coordinates table that
      every other event type's Location Information omits (map + fields only). Observation's
      Non-Biotic and Community types also carry that same full Coordinates table (site/plot-level
      records, not a single organism) plus their own extra domain accordions (Land & Surfaces/
      Landscape Context Scores/Environmental Conditions for Non-Biotic; Landscape Context Scores/
      Overstorey Measurements/Tree Health for Community) - Occurrence's Individual/Population
      types are identical except Individual carries one extra "Voucher" accordion Population
      doesn't.
    - **`components/base/accordion/accordion.tsx` gained a `variant?: "divided" | "boxed"` prop**
      (default `"divided"`, the existing FAQ-page treatment, unchanged) rather than forking a
      second accordion component - `"boxed"` is a real second visual treatment (each section its
      own bordered `border-brand-100` card, `text-brand-tertiary` title, a divider between header
      and body) matching Figma's own "Details Container" pattern exactly. Same controlled
      `openKeys`/`onOpenKeysChange` interaction either way - only the item chrome branches.
    - **`app/pages/_shared/map-search/side-panel.tsx` gained two additive props**: `headerActions`
      (extra controls between the title and close button - the new sidebar's expand/collapse-all
      toggle lives here, so it stays visible at the top regardless of scroll position, per "keep an
      icon on the top") and `widthClassName` (default unchanged `max-w-md`; the new sidebar passes
      `max-w-2xl` to comfortably fit label+value rows). Every existing `SidePanel` consumer
      (customise-columns, the generic Artefacts detail panel) is untouched.
    - **New `app/pages/_shared/map-search/record-detail.tsx`** - `RecordDetailSidebar` (the
      exported component) plus one section-builder function per record kind (`buildProjectSections`/
      `buildEventSections`/`buildOccurrenceSections`/`buildObservationSections`), each returning
      real `AccordionItemType[]` driven directly off the schemas above. Shared primitives
      (`Field`/`FieldStack`/`PlaceholderFields`/`ColumnTable`/`LocationMapPreview`) back every
      section so 15 record-type schemas didn't mean 15 hand-written layouts. `LocationMapPreview`
      reuses the *real* Leaflet `SAMap` the search screen's own map already is (a single-point
      circle boundary at the record's own lat/lon, draw tools disabled) rather than a fabricated
      static image - confirmed live, a real interactive OSM map renders inside "Overview"/
      "Location Information" on every record. Every field renders a real Figma-documented label;
      most values are an honest "-" because `search-data.ts`'s mock model doesn't carry BDBSA's
      full schema depth (Legacy IDs, IBRA regions, vouchers, landscape-context scores, ...) - the
      same "-" Figma's own mock content shows for the same fields. The two places this build *does*
      have real data (Start/End Date, and every record's own real lat/lon) render that real value
      - confirmed live: Occurrence's "NSX Code & Species"/"Occurrence Status" showed real
      `Tachyglossus aculeatus`/`Present`, Locations tables showed real latitude/longitude.
      **Deliberate simplification, logged rather than silently done**: Figma's densest multi-column
      stat/measurement grids (Occurrence's "Measurements" table, Observation Community's
      "Overstorey Measurements" reading pairs) are flattened into plain label rows instead of
      reproduced as exact multi-column tables - none of this build's data ever populates them
      either way, so the simplification costs no real information, only exact pixel layout for a
      section that's already 100% placeholder.
    - **`ContactBlock`** (Project's Data Owner/s and Project Manager/s) maps the one real
      contributor field `SearchEvent` already carries (`contributorName`/`contributorInitials`,
      the real `Avatar`) as the Primary Contact, org name as the org block, and an honest "-" for
      Secondary Contact and for email/phone (fields this build's data model doesn't carry at all,
      never a fabricated address) - Data Owner/s and Project Manager/s both show the same one real
      contributor since this dataset has no separate owner-vs-manager contact split, an accepted,
      documented simplification rather than inventing a second contact.
    - **`results-table.tsx`'s `ResultsTable` gained an optional `onRowClick` prop** - when set, a
      row click (or the pinned "View Project" action) calls it instead of opening the table's own
      generic `detailRow` panel; the Projects/Events/Occurrences/Observations tabs in
      `app/pages/observations/option-1/page.tsx` all pass one that opens the new
      `RecordDetailSidebar` (lifted to page level via a `selectedRecord` state so it persists
      correctly across tab switches), while the Artefacts and Attachments tab omits it and keeps
      its original generic panel, matching the Figma scope exactly.
    - **`HierarchyCell`'s own ancestor-click detail view was also switched to the same
      `RecordDetailSidebar`**, replacing its previous hand-rolled 6-field `dl` - flagged as a real
      inconsistency risk before it ever shipped (the same Site clicked as a table row would have
      opened the full accordion sidebar, but clicked as a Hierarchy breadcrumb would have opened a
      plain summary) and fixed in the same pass rather than left for later, per this file's own
      "any component-level change flows through to every place it's used" rule. Verified live: a
      Hierarchy ancestor click on a Quadrat row's `TR00502` segment opens the full Transect
      accordion sidebar, identical to clicking that Transect's own row directly.
    - **Expand/collapse-all state resets to "first section open" the instant a different record is
      selected** - implemented via the documented React pattern of adjusting state during render
      when a tracked identity (the record's own kind+id) changes, not a `useEffect` (which would
      cost an extra render for the same result, the same reasoning this codebase already applies
      elsewhere to avoid the "setState in effect" cascading-render pattern).
    - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, then an extensive live
      Chrome pass across a real 3-project search (Adelaide Hills/Naracoorte/Mount Remarkable, 28
      records): the Project row opened all 11 sections with real data (Project No, Abstract, a
      real interactive map centred on the project, both Contact blocks) and the expand-all toggle
      correctly opened/collapsed every section together; a Site row confirmed the Site-only shape
      (no Temporal Details, the full Coordinates table with real lat/lon); an Occurrence
      Individual row confirmed the Voucher section and real NSX Code/Status values; an Observation
      Community row confirmed its own Landscape Context Scores/Overstorey Measurements sections;
      and the Hierarchy dropdown's ancestor link opened the identical shared sidebar for a
      Transect. Zero console errors across every one of these opens.
  - **Twenty-third follow-up: the plain-text Level 1/Level 2 caption promoted to a real, single-
    line `AlertFullWidth` warning banner pinned above everything else on the results screen**, per
    direct request ("on the top"). First pass gated it `!isPublicUser` (reasoning: `publicUserNav`
    has no DLA section for a guest to land on) - **reversed the same session, per direct follow-up
    request ("show the alert to the public users also")**: the banner now renders for every role,
    with the CTA itself branching instead of the whole banner being hidden.
    - **Registered users** get a real "Go to DLA" button wired to a real `onConfirm` -
      `goToSection` to the real "Data Licencing Agreement (DLA)" nav entry - since that destination
      genuinely exists for this role.
    - **Guests get the same real, always-visible CTA pattern `GuestActionButton` already
      established elsewhere on this page** (see "User roles" above), not a hidden banner or a dead
      link: the button reads "Sign up for access" and opens the same real sign-up-invite modal
      (`SignUpPromptModal`, exported from `guest-action-gate.tsx` - previously a private helper
      inside that file, now reused by a second real consumer) instead of navigating to a section
      that doesn't exist for this role. Clicking "Sign up" inside it fires the same honest
      `toast.brand(...)` ("Sign-up isn't built yet...") the existing `GuestActionButton` flow
      already uses - no new dead-end invented, the established one reused.
    - Verified live across both roles: `registered-user` shows the banner with a working "Go to
      DLA" button landing on the real (still unscoped) DLA section; `public-user` shows the same
      banner with "Sign up for access", opening the real invite modal, and the modal's own "Sign
      up" button firing the real toast and closing itself - zero console errors either role.
  - **Twenty-fourth follow-up: the map search results page's Artefacts and Attachments tab now
    opens the exact same artefact preview modal `project-detail/option-1` already has**, per
    direct request, with that modal's own metadata panel corrected to match Figma's real
    "Artefacts and Attachments Overlay" frame (`https://www.figma.com/design/
    wer8CgO1UoCH3aQw2jQkdy/BioData-SA-High-Fidelity?node-id=2486-63681`) exactly.
    - **`ArtefactLightbox`/`ArtefactCarousel`/`Artefact` extracted to a new shared file**
      (`app/pages/_shared/artefact-lightbox.tsx`) - previously a private, page-local
      implementation inside `project-detail/option-1/page.tsx`. Each consumer still supplies its
      own `artefacts` array (the data genuinely differs per page); only the modal/carousel
      implementation itself is now shared, so a future change to it only has to happen once.
      `project-detail/option-1` was updated to import from the shared file instead of its own
      local copy - confirmed via a live pass that its own Artefacts carousel and lightbox still
      render and behave identically post-extraction.
    - **The metadata panel's field set was read directly from Figma** (`get_metadata` then
      `get_design_context` on the overlay's own `MetaSection`, node `I2486:63512;1892:26966`) and
      rebuilt to its exact 12 rows, in order: Title/Created/Creator/Artefact-Object-Id/Description/
      Format/Identifier/License/Publisher/Rights-Holder/Type/BioDataID - replacing the previous
      7-field set, which had a "Linked Record" row Figma's own frame never shows in this panel at
      all (that context already lives in the modal's own header subtitle, left untouched) and was
      missing Title/Object Id/Description/Rights Holder/Type entirely. `License` and `Identifier`
      now hold real URLs rendered as working links (Figma's own frame shows both as clickable),
      not the previous short `"CC BY-NC-SA 4.0"` label. Per this file's own established precedent
      (the modal was already vetted once against a different dark-themed external reference and
      deliberately kept this codebase's own light theme, not that reference's dark one) - this
      pass only corrects the field set to match Figma, not the whole modal's visual theme.
    - **`project-detail/option-1`'s own 4 artefacts were re-derived to fill every new field
      honestly**: `identifierUrl` points at `data.environment.sa.gov.au` (a domain this codebase
      already cites elsewhere for real BDBSA content, not a fabricated one), `licenseUrl` is the
      real Creative Commons URL Figma's own frame shows, `dcType` uses real DCMI Type Vocabulary
      terms (StillImage/MovingImage/Text/Dataset) matching each artefact's real file kind, and
      `objectId`/`rightsHolder` follow the same "org-prefixed code" / "same org as publisher"
      pattern Figma's own example uses.
    - **The map search page's own resources (`SearchResource`) are mapped into the shared
      `Artefact` shape via a new `resourceToArtefact` in `app/pages/observations/option-1/
      page.tsx`** - every derived field comes from real data already on the resource (its own
      filename extension decides image/pdf/video/spreadsheet; its parent chain's real Project org,
      via the already-real `rootProjectForParentEventId`, becomes the publisher/rights
      holder/object-id prefix); `size`/`creator` are an honest "-" since this dataset doesn't track
      a real file size or per-resource author. `ArtefactType` gained a new `"link"` variant for
      Reference Link resources (a real DCMI `InteractiveResource`, using the same `Link02` icon
      `resourceTypeIcon` already uses for this type) - not previously a concept in project-detail's
      own artefacts, since it never had a link-type resource. `ResultsTable`'s existing `onRowClick`
      override (added for the record-detail sidebar) is reused here too - clicking any Artefacts
      and Attachments row now opens this modal at that row's index within the current search
      results (not the row's own internal table-filtered subset, matching project-detail's own
      "one fixed array" carousel/lightbox relationship), with prev/next navigating the same set.
      The modal's own "Attached Resources" list picked up a `max-h-64 overflow-y-auto` scroll cap,
      since the map search results page can have many more than the 4 project-detail always has.
    - Verified live: `project-detail/option-1`'s own Artefacts carousel + lightbox still open and
      show all 12 corrected metadata fields with real values (confirmed the working Identifier/
      License links). On the map search results page, clicking a File-type resource
      ("Field-notes.pdf") opened the identical modal with correctly derived metadata (real Object
      Id `AHL:AHL:OCRP094`, a real Identifier link); clicking a Reference Link resource
      (`https://gbif.org/species/2481660`) opened the same modal with `type: "link"`'s own icon,
      `format: "text/uri-list"`, and the Identifier field correctly showing that exact GBIF URL
      rather than a constructed one - zero console errors either page. `tsc --noEmit`/`eslint`
      clean on every touched/new file.
- **`/pages/biodata-home` wired to the `public-user` persona (Sept 21 2026 merge of `BiodataLandingPage`).**
  The landing page is the signed-out front door, so it now owns a `publicUserHref(path)` helper
  (`?userRole=public-user`, typed against `UserRole`) instead of `useRoleHref` - it has no role of its own
  to read from the URL, and needs no `<Suspense>`. The header's primary "Explore" button now goes to
  `/pages/dashboard?userRole=public-user` (the public-user Home landing); the "Dashboard" nav link,
  "View Dashboard" tile, hero search, and "Start Exploring" CTA carry the same role instead of a bare path
  that would have fallen back to `registered-user`. The header's separate "Explore" nav *text* link still
  scrolls to the in-page `#explore` section, as before. Verified live: click "Explore" lands on
  `/pages/dashboard?userRole=public-user` with Log in/Sign up in the header and no ProfileMenu.
- **Consistency check after merging `BiodataLandingPage` (Explore map search, artefact lightbox,
  `Accordion` `variant="boxed"`, table changes) - fixed on the spot:** three live `text-md` uses
  (`side-panel.tsx`, `artefact-lightbox.tsx`, `Accordion`'s boxed title) -> `text-base` (Untitled's `md` is
  16px); an arrow character in a rendered column tooltip (`observations/option-1`) reworded; and
  `*-border-secondary_hover`, a class that was never defined, used in 4 places (`artefact-lightbox.tsx`,
  `home-dashboard.tsx`, and two `/proto` pages) -> `border-primary`. `Accordion`'s new `variant` prop, plus
  the previously undocumented `openKeys`/`onOpenKeysChange`, are now in its API table with a gated
  "Variants" section and a `variants` config key. All 13 touched routes render with zero console errors.
  - **Known gap: `Modal`'s dim overlay is transparent.** `bg-overlay/70` (used by `modal.tsx` and the new
    `side-panel.tsx`) only resolves in the orphaned `styles/theme.css`, so the backdrop computes to
    `rgba(0,0,0,0)` - blur only, no dim (confirmed via `getComputedStyle`). Not fixed here: the overlay
    colour needs a Figma-checked value and changes every modal in the system.
  - **Known gap: the em-dash character used as an empty-value marker** in sample data (`search-data.ts`, `project-detail`) and
    a few prose strings in `project-detail`/`tree-view` predate this merge and break the no-em-dash rule;
    left as-is pending a call on whether a lone em-dash null glyph counts as copy.
  - **Stale note above:** "Add project"/"Upload dataset" are no longer hidden for `public-user` - they
    render visibly and open a sign-up prompt (`guest-action-gate.tsx`), per the later public-user pass.
- **Sept 21 2026 route normalisation: every `/option-1` suffix is gone; each sidebar-shell page lives at
  its plain route.** `project-list`, `project-detail`, `observation-detail`, and `observations` moved
  (`git mv`, history kept) from `app/pages/<name>/option-1/page.tsx` to `app/pages/<name>/page.tsx`,
  finishing what the Sept 16 decision did for `dashboard` alone. The convention going forward: **a
  page under `/pages` has no `/option-*` suffix once it is the chosen direction; `option-N` folders
  exist only while a screen is still a competing exploration.** `dashboard/option-2` and
  `project-list/option-2` stay in place, untouched, as records of the explored top-nav direction, per
  the "never delete an explored direction" convention. `lib/registered-user-nav.ts`'s `keyHref(key)` is
  now simply `/pages/${key}` with no special case, so a new keyed section needs no route bookkeeping.
  - Every internal link, `router.push` target, breadcrumb crumb, and doc-page link was repointed, and
    file-path references in code comments were updated to the new paths. Old URLs (`/pages/<name>/
    option-1`) now 404, same as `/pages/dashboard/option-1` did after its own fold - no redirects were
    added, since these are working screens reached by direct URL, not published surfaces.
  - **Older entries in this file still say `<name>/option-1`.** They are a historical record of the
    work as it happened and were left as written; read them with the paths above in mind rather than
    treating them as current routes.
  - Found and fixed while crawling every internal link for both roles: `FeaturedProjectCard` on Home
    linked with a bare `project.href`, so clicking a featured project dropped the active `userRole`
    (the same dead end `useRoleHref` exists to prevent) - now wrapped in `roleHref`.
  - **Applied across every persona, not just the two in build focus:** the crawl and rail click-through
    was run for all six roles (`biodata-admin`, `biodata-user`, `privileged-admin`, `privileged-user`,
    `registered-user`, `public-user`) across the 5 canonical pages plus both `option-2` records - 42 page
    loads, all 200, zero console errors, every rendered `/pages/**` link carrying the loaded role, and
    Home/Projects/Explore in the rail landing on `/pages/dashboard`/`/pages/project-list`/`/pages/observations`
    with the role preserved for each.
  - **The option-2 top-nav shells linked to a page that never existed.** Both build `/pages/${node.key}/
    option-2` for every keyed nav node, and the `observations` key (added with the Explore page) has no
    option-2 page, so their "Explore" entry 404'd. Found by the all-roles crawl, not by reading code. They
    now link only the keys in `OPTION_2_KEYS` (`dashboard`, `project-list`) and render any other keyed node
    as a plain label, the same non-link fallback those files already used for un-keyed sections.
  - Verified live (public-user/registered-user first pass): all 6 pages return 200, every `/pages/**`
    link rendered on them resolves 200 and carries `userRole`, the old `/option-1` URLs 404, and the
    landing -> Explore -> public dashboard -> rail (Projects/Explore/Home) and project-list row ->
    project-detail flows land on the plain routes with zero console errors. `tsc`/`eslint` clean.
- **Sept 21 2026: Lapse removed; public-user flow specified, options at `/proto/public-user`.** `@aiforui/lapse`,
  its `.npmrc` registry line and `instrumentation-client.ts` are gone (`package.json` and the lockfile match
  the previous commit again).
  - **Public-user flow, as specified by the user (flow layer, see "Build hierarchy"):** (1) lands on
    `/pages/biodata-home`; (2) header "Explore" goes to `/pages/dashboard?userRole=public-user`; (3) the Home
    dashboard has the same three-column shell as `registered-user` (icon rail, column 2, main) with stripped-back
    content; (4) main opens with a gradient card like the registered-user "Hi, Olivia" card, but its message
    changes with the dashboard tab (Overview / Flora / Fauna / Projects) and always offers account creation;
    (5) column 2 explains what BioData SA is and points to guides. This **reverses** the earlier "no `<aside>` for
    guest Home/Projects" decision in "Exploratory page layouts": that reasoning held only while column 2 had
    nothing to hold, and it now does.
  - **Not decided yet:** what column 2 does. `/proto/public-user` compares three directions on that one axis
    (Reference: flat and always visible; Disclosure: the boxed `Accordion`, one section open; How it works: explains
    the journey from sighting to project to published record in three steps, with the guides underneath).
    "Follows the tab" (a fixed about plus guides that changed with the active tab) was cut: it was Reference plus one
    behaviour, and its context was thin because it only reshuffled the same five Knowledge Centre categories and every
    guide points at the same landing-page section. Revisit once real per-topic guides exist. Header, rail, gradient card and dashboard are
    shared and fixed. Not built into `/pages/dashboard` until one is picked.
  - **Copy rules held in the lab:** plain government-service tone, one ask per tab phrased around what the guest
    is looking at, no growth-marketing lines. Guide rows use the real Knowledge Centre category names and
    descriptions from `/pages/biodata-home`; there are no guide pages yet, so the only link is one real anchor to
    that landing-page section. The card reserves a headline plus two body lines so changing tab never shifts the
    dashboard below (caught live: one message wrapped an extra line and moved the tabs 8px).
  - **`DataOverviewContent` keeps only its controlled `activeTab`/`onActiveTabChange` props.** An interim pass added
    `projectsTab` and `showProjectsMetric` for a Species tab; both were removed when that direction was reverted (see
    the "features reduce" entry below), so the real dashboard component is unchanged for every role.
  - **Copy round 2 for the public-user gradient card (per direct feedback: "more engaging, and nudging").** Each
    tab now leads with a headline that speaks to what the guest is looking at and names the personal payoff, then
    one body line that gives a concrete reason to act: Overview "Your sightings belong in this record", Flora
    "Found a plant that isn't on the map?", Fauna "Spotted a bird, mammal or reptile? Log it.", Projects "Give your
    survey a home in the record". The CTA stays "Create a free account" on every tab because that is what the click
    does; the nudge lives in the headline and body, and the sign-up modal each one opens repeats the same specific
    ask. The tone rule that held: warm and second-person, but every claim is one BioData SA already makes about
    itself (who contributes, what records are used for, that every record belongs to a project). No invented
    contributor counts, no urgency, no exclamation marks. Headlines stay under ~46 characters so they hold one line
    at the card's 640px text width.
- **Sept 21 2026: public-user is species-first (per direct feedback: public users are more curious about species
  than projects; a project is only a way of organising species by their occurrences and observations).** Scoped to
  the public-user persona and built so far only in `/proto/public-user`; the real `/pages/*` shells are unchanged
  until a column-2 variant is picked and promoted.
  - **Header:** "Add project" and "Upload dataset" removed for this persona (only Log in / Sign up remain), and the
    search is a species search (common or scientific name) that jumps to the Species tab as you type. Repeats the
    earlier round-3 decision that the shipped `1834aa7` shell had reversed, so promote it to the real shells too.
  - **Rail: unchanged - Home, Projects, Explore (corrected the same day).** A first pass replaced Projects with
    Species, which was wrong: a public user still has to be able to go into Projects, find a project and read more.
    Species-first lives in Home (the Species tab, the species search, the copy), and Projects stays a real destination
    that reads species-first.
  - **Dashboard:** the fourth tab is "Species" (a browsable list with a group filter) instead of Projects, the
    Overview shows three cards (Records, Flora species, Fauna species) and drops "Projects across SA", and the gradient
    card copy is species-led on every tab.
  - **Same publication rule as Explore:** a species is listed only when the project that recorded it is Active or
    Completed, so drafts and projects under review never surface a species. Empty groups are hidden (Reptile has no
    public records in the mock data because its project is a draft).
  - **Known limits, not fixed:** the mock data gives 8 public species, all fauna, so the Flora tab stays aggregate
    only; there is no species detail page, so rows are not clickable (honest, not a dead link); and the group per
    species comes from a small factual lookup in the lab because the mock records carry none.
  - **Projects: unchanged, the real shared table (corrected the same day).** A first pass hand-built a species-first
    project list in the lab, which redesigned a screen nobody asked to change and stood in for the real `Table` with
    a lookalike. Reverted: the Projects section renders `ProjectListContent` exactly as `/pages/project-list` does
    (verified cell for cell), in the same three-column shell, with no gradient card because the real page has none.
    Rail -> Projects -> a project row -> project detail works as it always has. The one species-to-project link kept in
    the lab is on a species row ("Recorded through <project>"), which opens that project's record panel.
  - **Open, not changed:** the real Projects table shows Draft and Under review projects to a public user, while
    Explore hides them. That is the real page's behaviour for every role (see the Backlog entry on Level 1 public
    filtering), so it was left alone here; decide it when the real shells are updated.
  - **Still project-first, flagged for the next round:** Explore's results open on the Projects tab, the real
    shells' header search (`GlobalProjectSearch`) only finds projects, and the real `/pages/project-list` and
    `/pages/project-detail` don't list species yet. A species-first Explore, and a "Species recorded" summary at the
    top of the real project detail page, are the natural next steps.
- **Sept 21 2026: the public-user experience is the registered experience with features removed, never a redesign
  (per direct feedback: "The features reduce, they don't change fundamentally").** This supersedes the species-first
  entry above, whose Species tab, species header search and three-card Overview changed the shape of the screens
  instead of removing from them. Reverted in `/proto/public-user`: the header search is the real
  `GlobalProjectSearch`, the dashboard is the real Flora and Fauna Dashboard (Overview / Flora / Fauna / Projects, all
  four Overview cards), and Projects is the real `ProjectListContent`. What stays reduced, all removals: no "Add project"
  or "Upload dataset" in the header, no My BioData, no DLA / Nominate / Reports / Template Finder sections. What stays
  added because the brief asked for it: the gradient card (its copy per tab, and the Projects tab's ask restored) and
  column 2. The rule for the next round: to change what a public user sees, remove or gate a registered feature; do
  not substitute a different one. Species-first as a product direction is parked, not lost - it would need to arrive
  as a change to the shared screens for every role, decided separately.
- **Sept 21 2026: `public-user` is the app-wide default persona (per direct instruction: "keep public-user selected
  across our webapp, this is the starting point").** `DEFAULT_USER_ROLE` in `lib/user-role.ts` changed from
  `registered-user` to `public-user`, so any page opened without `?userRole=` (or with an unrecognised value) renders
  the signed-out visitor's view, and every in-app link built with `useRoleHref` carries `public-user` forward. Every
  other persona is reached by an explicit `?userRole=` or the `RoleSwitcher` FAB. `/pages/biodata-home` keeps its
  explicit `?userRole=public-user` on its links so the URL always states the persona. Anything that used to rely on
  landing as `registered-user` by default (a bookmarked bare URL, a screenshot walk-through) now needs
  `?userRole=registered-user`.
- **Sept 21 2026 QA pass over everything changed this session (the Final check contracts plus the post-ingestion QA
  checklist).** `tsc` and `eslint` clean on every touched file; 40 live page loads (all six roles across the five
  canonical pages, plus the lab, both `/test-*` screens and the Accordion/Table/Tabs docs) with no console or page
  errors; nav and config still alphabetical; no new dead utility classes, no em-dashes or arrow characters in added
  UI copy. Findings, all fixed in the same pass:
  - **`Accordion`'s new `boxed` title wraps but had no `text-balance`** (QA item 6) - added. Confirmed live that the
    boxed title, which sits inside `.prose-doc` on its own doc page, also picks up none of the doc-site heading rules
    (it is a span, not a heading).
  - **`/test-site-details` still called its Accordion "composed, not a real component"** after `Accordion
    variant="boxed"` landed - the flow-through contract. Swapped for the real component (a thin local wrapper adapts
    the title-plus-children call sites and keeps every section open on load, as the frame draws it), the mapping row
    and gap cards updated, and the composed version's dead `text-md` title class disappeared with it. The page keeps
    its own `rounded-lg` radius via a class override on the wrapper so nothing changed visually.
  - **The Table doc page didn't document the branch's new API** - `size="xs"`, `bodyScrollable`, `sticky`,
    `TableCard.PaginationNumbered`, `tableCardPaginationRange` - and still said numbered pagination wasn't built.
    API table corrected, a live "Numbered pagination" demo added, and the Figma-gap note dropped.
  - **Checked and clean:** portaled content carries Barlow (the sign-up modal, and the tooltip's text nodes - the
    outer overlay wrapper reads Geist but holds no text), the shell header is a top-level sibling on every shell, and no
    `components/base/**` change was made for a doc-only need.
  - **Known gap: `/test-site-details`' Figma frame could not be audited.** The Figma file returned "no access" when
    the swap was made, so neither the composed radius (8px) nor the real variant's default (6px) is verified against
    frame 88:11339. Revisit when file access is granted: compare the accordion radius, then drop the class override if
    the frame matches the component.
  - **Known gap: two dead utility classes in throwaway labs, present before this session:** `border-l-brand-solid` in
    `/proto/dashboard-options` and `border-error-subtle` in `/proto/data-model-stress-test` (neither exists in
    `app/globals.css`). Not fixed - the labs are not part of this work.
- **Sept 22 2026: project-detail takes the Master Flows Project Details copy, and the records tree follows the confirmed
  data model.** Source: Figma `yzQY87GXoyGGGPJDnh1hmi` node `10:58214` (Project Details Container, 11 accordions). The
  frame's accordions are not reproduced, they are the copy source: the existing tabs and layout are unchanged.
  - **Copy brought in:** title and Project No (Kangaroo Island Wildlife Rehabilitation, BD - 5034), Full Project Name,
    the full Abstract, "Data Owner/s" and "Project Manager/s" with a Primary and a Secondary Contact each, and the
    Details tab's Locations (Data Collection Location: MGA Easting/Northing, Latitude, Longitude, Study Area
    Description), Data Collection Scope, Permit and URI / DOI Number, in the frame's order. Where the frame leaves a
    field empty the row reads "Not provided", not a stray "-" (design principle above). "Targetted Species" is corrected
    to "Targeted Species". Contacts use the placeholder cast (Olivia Wyatt, Phoenix Baker, Maya Dewitt, Lana Steiner)
    instead of the frame's "Olivia Rhye", per the placeholder-person contract; email and phone values are the frame's.
  - **Not readable through Figma MCP:** the frame's last three accordions (Privacy and Restrictions, Additional
    Details, Comments) sit in nested instance slots that return no content, so the Restrictions and Additional
    Information tabs keep their existing copy. Re-pull them when the frame is opened in the desktop app.
  - **Kept, not overwritten:** dates, status, publisher, dataset table and record counts are data, not frame copy.
  - **Known mismatch:** project-list's real row is still named "Adelaide Hills Bushland Survey" and links here, and
    project-list-content already has a separate "Kangaroo Island Recovery Monitoring" row. Decide which project this
    page is, then rename the list row to match.
  - **Records tree, `app/pages/_shared/project-record-tree.ts` (new, shared by project-detail and observation-detail,
    which used to keep drifting local copies):** Project > Site > Visit > Occurrence > Observation, an Occurrence
    parenting exactly one Observation of the same type (Individual, Population, Non-biotic, Community).
    Transect/Quadrat/Ramble nest under the Visit they belong to. The Project is the tree's root node.
- **Sept 22 2026: `/pages/project-detail` rebuilt to a supplied screenshot.** Records sidebar (label "Records") reads
  Project > Site > Visit > Occurrence > Observation from `project-record-tree.ts`, root row is the project name and
  opens Overview; children only bucket by type once a node has more than 8 (`shouldGroup`), so a Site lists its
  Visits/Occurrences flat. The sidebar's own icon collapses every open branch. Main column: `LayoutLeft` sidebar toggle
  + "Back to projects", then the Home gradient card carrying the project ID/dates/status/publisher (the old "Project
  Details" rail card and the Datasets tab are gone, so nothing is stated twice), then 8 tabs (Overview, Locations, Data
  Collection Scope, Permit, URI/DOI, Privacy and Restrictions, Artefacts & Attachments, Comments). The Tree/Table
  toggle is a react-aria `ToggleButtonGroup` (nesting a second `Tabs` inside the tab row's `Tabs` would fight its
  collection); Table collapses the sidebar and shows an honest placeholder until its design is supplied.
  Demo project is now Adelaide Hills Bushland Survey, BD-5039, matching the Projects list.
  Also: `MapView` reflows on its own container's resize (Highcharts only re-measured on window resize, so a
  collapsing sidebar left a stale pixel width that pushed the Overview rail off screen); a record-type filter and
  Expand all / Collapse all sit above the tree; every Explore results table (`ResultsTable`) now defaults to the
  `md` row size the Projects page uses, and both Projects tables show the same Project ID (`code`, BD-5039).
- **Sept 22 2026 QA pass over that work (live Playwright, since a browser was available after all).** Found and fixed:
  `Table.Head` only applied the header style (`text-xs`, semibold, `text-quaternary`) to its `label` prop, so header text
  passed as children (the Projects page, the Table docs page, `dashboard/option-2`) rendered as unstyled bold black -
  the style now sits on the wrapper so both work; the project tree now opens fully expanded like the design; two
  em-dashes removed from the project-detail page (the End Date null marker became "Ongoing"); `text-balance` on new
  copy. Checked clean: every class on project-detail, Projects and Explore resolves to a real CSS rule (the only
  strays are the known `text-md` in `Input` and two component-internal tokens), the filter popover and tooltips carry
  Barlow, no horizontal or page overflow at 1024/1280/1440/1920 in either view, all 5 Explore tabs at 44px header /
  72px rows with the numbered footer for both roles, zero console errors on every page touched.
- **Sept 22 2026: project-detail's records-tree controls redone from Mobbin filter patterns** (Delphi, Devin, Plain,
  Copilot Money: active filters as removable chips + a Clear link; Dropbox: a type checklist with Select all;
  VS Code explorer via Shopify: tree-wide actions in the section header's "..." menu). "Records" header row carries a
  `Dropdown` "..." menu (Expand all / Collapse all) instead of two unlabelled double-chevron icons; search sits beside an
  icon-only `Button` filter that tints (`bg-brand-50`) while a filter is on, its popover is the record-type `Checkbox`
  list with Select all / Clear, and the real `Tag` component shows each active type as a removable chip beneath.
  Built on `/pages/project-detail`, not `/proto/public-user` (that lab only varies the left column and has no records
  tree). Checked live: menu, filter, chip remove, Clear and Select all all drive the tree, portaled menu and popover carry
  Barlow, no dead classes in the sidebar, zero console errors.
- **Sept 22 2026: Data Sharing Agreement (DSA) workflow for `biodata-admin`, at `/pages/dsa`.** Source: the Master
  Flows lo-fi (Figma `yzQY87GXoyGGGPJDnh1hmi`, node `3:15901`: DSA List, DSA Empty State, DSA Record form). The lo-fi is a
  starting point; its content is fitted into the shell, none of its own header or two-pane chrome is reproduced.
  - **Fit into the shell, and the list -> deep dive structure (revised the same day, per the user).** The first pass put the
    agreement list in column 2 and the record in main on one page. Reworked to follow Projects: `/pages/dsa` is a table
    (`DsaListContent`: Agreement, Data partner, Agreement period, Requested by, Shared via, Updated; rows link out), column 2 is
    the four status buckets as links with counts, a row opens `/pages/dsa/<id>` (the deep dive), and the form lives at
    `/pages/dsa/new` and `/pages/dsa/<id>/edit`. Pattern documented in "List -> deep dive" above. The lo-fi's own header and
    two-pane chrome are still not reproduced. Column 2 (status buckets) also appears in the mobile menu below `lg`.
  - **Nav:** `biodataAdminNav` in `lib/registered-user-nav.ts` is the registered-user tree with the DLA section given its
    admin items (Approve Reject DLA Requests, Withdraw DLA) and a keyed "Data Sharing Agreement (DSA)" leaf added straight
    after it; `navForRole(role)` picks the tree and the five sidebar shells (dashboard, project-list, project-detail,
    observation-detail, observations) call it instead of the inline public/registered ternary. `key: "dsa"` -> `/pages/dsa`
    through the existing `keyHref`/`goToSection`, so no per-shell routing was added. DSA's rail icon is `FileCheck02`, DLA keeps
    `FileLock01`. Gated by the `dsaManagement` feature (`[]`, admin only); a direct visit by any other role shows an honest
    "managed by BioData Admins" state. Every non-admin nav is unchanged.
  - **Correction, same day:** the first pass swapped DLA out for DSA in the admin tree, treating them as one renamed concept.
    That was wrong - the admin IA screenshot (see the cross-check entry below) keeps DLA as its own module and the review
    comments list DSA as an additional one. DLA is restored; DSA is a separate section.
  - **Deep dive** follows the lo-fi's three cards (Agreement overview, Agreement contacts, Data sharing methods) but renders
    read-only facts as label/value pairs, not grey input-looking boxes, and shows "Not provided" for empty values. The API
    systems table is a real `Table`; its "View details" opens a `SidePanel` with scope, permissions, the organisation contact
    and credentials (masked until "Show tokens"). Actions menu: Edit / Revoke (Draft: Edit draft / Delete draft, Revoked: none),
    each destructive one behind a `DestructiveModal`. **Download PDF is a toast**, not a download: no PDFs are stored in this build.
  - **Deep dive opens with the same gradient card as Home/project-detail (same day, per direct request: "the metadata sort
    of sits in there").** A plain toolbar (Back to agreements, Download PDF, Actions) sits above it - action buttons stay off
    the gradient, same "the banner doesn't carry action buttons" precedent as the Home dashboard's own copy of this card - then
    the card itself carries the agreement's identity (`DATA SHARING AGREEMENT` label, the ID as an H1) and its short-form
    metadata (Data Partnership, Valid From, Valid To, Status) as `MetaField`s, `onDark`. The Agreement Overview card below
    dropped those same four fields - it now holds only Purpose of Data Sharing and the signed file, the two that don't fit a
    compact metadata row - so nothing is stated in two treatments. Agreement Contacts and Data Sharing Methods are unchanged;
    the gradient card is the glanceable identity, not a replacement for the full contact details. Verified live on both an
    Active agreement and a Draft with unset dates/contacts (`Not provided` on `white/70` still reads clearly on the dark
    gradient) - `tsc`/`eslint` clean, zero console errors, Edit/Revoke still work unchanged.
  - **Correction, same day: the deep dive's own information arrangement rebuilt to borrow project-detail's structure
    directly, per direct follow-up feedback** ("the structure of arranging information should also be borrowed from the
    project details screen. Currently the DSA information screen looks like it's all over the place"). The gradient-card pass
    above still stood, but everything below it was 3 same-weight `BentoCard`s stacked flat, each re-announcing its own icon
    +title (redundant once the gradient card already states the identity), and Agreement Contacts crammed both contacts into
    one shared card's grid rather than giving each its own boundary - the actual "all over the place" complaint, not any one
    card's content. Replaced with a real `Tabs`/`TabList`/`TabPanel` row directly under the gradient card, `type="underline"
    size="md"`, the exact treatment project-detail's own `ContentTabs` uses (no extra wrapper - `TabList` draws its own
    underline): **Overview** (Purpose of data sharing, the signed file, then Agreement requested by / Agreement custodian as
    two separate `BentoCard`s side by side - the same per-contact-card fix project-detail's own `ContactCard` already applies,
    renamed from `ContactPanel` to `ContactCard` to match) and **Data Sharing** (the offline/system methods plus the API
    systems table, unchanged). No tab panel repeats its own tab's label as a card header - the tab already says where you are.
    Verified live: both tabs switch correctly, the system detail `SidePanel` still opens from the Data Sharing tab, the two
    contacts render as visually distinct cards - `tsc`/`eslint` clean, zero console errors.
  - **Second correction, same day: the rigour and polish from project-detail ported directly, per a screenshot of that
    exact screen** ("the rigour and polish from projects needs to flow through to these screens as well"). The prior
    round fixed the *tiering* (tabs instead of a flat card stack) but the tab content itself was still plainer than
    project-detail's own Overview: loose `Field` rows with no card boundary, and `ContactCard` was an approximation
    (name/email/phone as three bare lines, no icons, no org context) rather than a direct port of the real component.
    Now ported exactly, not re-derived:
    - **Overview and Data Sharing each render as one bordered card** (`rounded-lg border border-secondary`), its own
      fields divided by `border-b` - a baseline label-left/value-right row for a short fact (Signed agreement, Data
      shared via offline - project-detail's "Full Project Name" row) and an uppercase eyebrow-label section for a
      longer one (Purpose of data sharing, Data shared via system - project-detail's "Abstract"/"Geographic scope").
      Purpose does not get project-detail's `line-clamp-3`/"Read more" treatment - DSA's purpose text is short enough
      that it would be a "Read more" button that never has more to show, a fake affordance, not a real port.
    - **Overview's contacts moved from a same-width grid into a persistent right rail** (`lg:w-80 lg:shrink-0`, main
      content `flex-1`), matching project-detail's Data Owner/Project Manager rail exactly rather than two cards
      competing for the same width as the main content.
    - **`ContactCard` rebuilt to project-detail's real component**, not approximated: an optional `orgLabel` under the
      title (passed as `dsa.partner` for "Agreement requested by" - real, distinct information; omitted for "Agreement
      custodian (DEW)", since its org is already named in the title and repeating "DEW" a line below would be a literal
      duplicate, not the accepted-duplication case), then a `border-t` divider, the contact's name, and a real
      `Mail01`/`Phone01`-led row instead of two bare text lines.
    - **Deliberately not ported**: project-detail's `FlaggedConceptsBanner` (an admin review queue over a project's own
      flagged concepts). DSA's data model has nothing real to flag on an agreement yet, so no banner was faked here
      just to visually match - "rigour" means porting real structure, not inventing a feature to look busier.
    - The list page (`dsa-list.tsx`) was checked against `project-list-content.tsx` and already matches its pattern
      (`SectionHeader`, `TableCard`, numbered pagination, linked rows) - its one addition, a local per-bucket search
      box, is justified (the global header search is projects-only) and not a gap to fix.
    Verified live on both an Active agreement (all fields populated) and a Draft (partner/purpose/file/custodian all
    empty) - "Not provided" rows and the custodian's icon-less empty state both render cleanly, `tsc`/`eslint` clean,
    zero console errors.
  - **Form** is tiered, not one flat scroll (the lo-fi has ~8 field groups plus a repeatable system block): tabs Agreement /
    Contacts / Data sharing, error counts on each tab after a failed submit, a footer count, a sticky Back / Save draft / Submit
    bar, a discard guard on Back, and each API system as its own boxed `Accordion` item (only present once "System" is
    ticked, as in the lo-fi). Tokens are masked by default; "Re-generate tokens" is confirmed because it invalidates the old ones.
    Tokens are random JWT-shaped placeholders, never real credentials. Draft needs only the organisation; Submit validates the rest.
  - **State is a module store** (`dsa-store.ts`), seeded from `dsa-data.ts`; create, edit, revoke, draft and delete all work
    across routes for the session and vanish on reload (a deep dive for an agreement created this session then shows "not found"). Status is stored, not derived from dates (see open questions).
  - **Gaps, both unresolved:** (1) **"Purpose of Data Sharing" is a `?` marker**: it needs a multi-line field and DEW has no
    Textarea (the same gap `/test-site-details` logs). It is not validated, so new agreements save with no purpose until a
    Textarea is ingested. (2) **"Upload Agreement" uses the real `InputFile`** (button + file name, PDF only, 5 MB) in place of
    the lo-fi's drag-and-drop zone; same job and accepted types, different affordance. The lo-fi's concentric-ring empty-state
    backdrop is a decorative graphic with no asset here and is left out.
  - **Open questions for the business, none decided here:** (a) **DLA vs DSA, resolved:** two separate modules (see the
    correction above). The lo-fi's empty-state body still says "Data Licensing Agreement", which reads as a lo-fi copy slip.
    (b) **What "Inactive" means** and whether anything moves an agreement between buckets automatically (expiry?).
    Only Save draft, Submit and Revoke transition status. (c) **Is there an approval step?** The lo-fi's empty-state copy
    ("seek approval... track the status of your request") describes a requester waiting on a decision, but no Pending status is
    drawn; an admin's Submit makes an agreement Active. The requester-facing flow is a different persona and is not built.
    (d) **Permissions per scope or per system?** The lo-fi shows one Read/Write pair under the scope select; built once per system.
    (e) The lo-fi list's filter icon beside search has no defined behaviour and is omitted.
  - **Shell note:** the shell is one shared component, `DsaShell`, used by all four DSA routes. `ProfileMenu` and
    `GuestAuthActions` were extracted to `app/pages/_shared/profile-menu.tsx`; the five older shells still carry their own
    identical copies (separate cleanup). The form
    footer clears the `RoleSwitcher` FAB (`pr-20`), which otherwise sits on top of Submit.
  - Verified: `tsc` and `eslint` clean on every touched file; live Playwright pass over list, detail, system panel, all four
    empty states, create (empty submit, per-tab errors, bad email, wrong file type, system + scope + permissions, token
    show/re-generate, submit), edit of a live agreement and of a draft, revoke, delete draft, search, all 6 roles, rail
    navigation from three other shells with the role preserved, and an 800px viewport; zero console errors.
- **Sept 22 2026: BioData Admin IA cross-check.** Source: the team's "BioData Admin" IA tree (a screenshot supplied by the
  user, plus a review-comment thread listing modules still to include). This is the real admin IA; today's admin experience
  is the registered-user tree plus the DSA work above, so most of it is unreconciled. **Nothing below is built except DSA,**
  logged so the next admin pass starts from the real tree, not from `registeredUserNav`.
  - **The admin tree, as given:** Header (Profile > Profile Settings, Logout) - Home (BioData Overview, BioData Dashboard) -
    Projects (Manage Level 1-4 Project Data; Create Project > Add Project Details, Privacy and Restrictions > Embargo /
    Sensitive Species and Location / Restrict Project Metadata / Request Other Restrictions; Download Project Templates;
    Create / Upload Dataset) - Observations (View Level 1-4 Observation Data; Nominate Sensitive Species) - Data Licencing
    Agreement (DLA) (Approve Reject DLA Requests; Withdraw DLA) - Template Finder (Browse and Download Standard Dataset
    Templates) - User Management (Add Privileged User / Admin; Add Biodata User / Admin; Manage Privileged User Roles; Manage
    Biodata User Roles; Manage Biodata User Permissions; Manage Privileged User Permissions) - Reports (All Users)
    (Application and System Reports; Audit Log Reports) - Ctrl Vocab (Create / Manage Ctrl Vocabs) - Footer (Terms and
    Conditions, Privacy Policy, Help and Documentation).
  - **Modules from the comment thread, not yet in the tree:** Voucher management, Notification management, Taxonomy
    management ("to include"), and DSA (added later; built above). Placement of the first three is undecided: whether each is
    its own top-level section or sits inside another one (Taxonomy and Ctrl Vocab are plausibly neighbours).
  - **Matches what is built:** the Header account menu and the Footer links; the Create Project steps, Download Project
    Templates and Create / Upload Dataset (already `projectActions`); Template Finder; Home's admin content already treats
    "DLA requests" and User Management as approval queues (`AdminHomeDashboardContent`), consistent with DLA staying an admin
    module.
  - **Differs from what is built:**
    - **Access tiers: the admin IA says Level 1-4, this file and the BDBSA research document two (Level 1 public, Level 2
      DLA-licensed).** Either Levels 3-4 are admin-only tiers we never captured or the IA is looser than the data model; needs
      a decision before "Manage Level 1-4 Project Data" or "View Level 1-4 Observation Data" gets a real screen.
    - **Observations vs Explore.** The admin IA has an Observations section with no map-search entry; every role's shell
      currently shows "Explore" (`/pages/observations`). Unclear whether admin's Observations *is* Explore, sits beside it, or
      Explore is not an admin module.
    - **Nominate Sensitive Species sits under Observations** for admin, but is its own top-level section in the registered-user
      tree and every shell's rail.
    - **Home labels.** Admin's Home is BioData Overview / BioData Dashboard; every shell hardcodes "My BioData" / "Flora and
      Fauna Dashboard" for every non-guest role, admin included (the admin *content* differs, the tab labels do not).
    - **Reports.** "Reports (All Users)" with Application and System Reports and Audit Log Reports, against registered-user's
      "Reports (Own Submissions)" with one item.
    - **DLA items.** Approve Reject DLA Requests / Withdraw DLA (admin) against Request New DLA / Manage DLA (registered).
      Restored in `biodataAdminNav` as unscoped items, since neither has a page.
  - **Missing from the codebase entirely:** User Management (6 items; only a disabled quick action exists), Ctrl Vocab, Audit
    Log Reports, and the three unplaced modules above. The Home dashboard's own copy calls the second one "Control Vocal";
    the IA says "Ctrl Vocab".
  - **Next step, not started:** replace `biodataAdminNav` with the real tree above (unscoped sections stay honest
    placeholders), then reconcile Home's tab labels and the Observations / Explore question. Blocked on the decisions listed.
  - **Restructure verification (list -> deep dive):** `tsc` and `eslint` clean; live Playwright pass over the list, all four
    buckets (including the empty Revoked one), row -> deep dive, Back to agreements, edit route, revoke from the deep dive
    (the record's bucket highlight moves, counts update), new -> Save draft -> the new draft's deep dive, and the not-found
    state; **all 5 personas x 4 routes** (list, deep dive, new, edit) each render rail + column 2 + main under a single
    header; the role survives every link. Fixed on the way: `useRoleHref` produced `?status=x?userRole=y` for paths that
    already had a query. Known limit: a restricted persona's column 2 holds only the section label and footer links, so it
    reads sparse; it's the cost of keeping three columns and can be revisited once there's something honest to put there.

- **Sept 22 2026: `/proto/public-user`'s explorations folded into the real `/pages/*` shells, per direct
  instruction** ("fold all the explorations we did for public-user into our /pages/* production route. I liked the
  'Reference' variant"). Everything the lab worked out - the gradient card with per-tab copy, and a real column 2 -
  had stayed lab-only; production's `dashboard`/`project-list` still ran the pre-Sept-21 "no aside, no gradient card"
  branch for `public-user`'s Home/Projects. Folded in, not re-derived:
  - **New shared file `app/pages/_shared/guest-home.tsx`** - `GuestGradientCard` (the gradient surface, one ask per
    Flora and Fauna Dashboard tab from the lab's `tabAsks`, always ending in "Create a free account") and
    `GuestAboutAside` (the picked "Reference" variant - "What is BioData SA?" plus a Guides list, both always
    visible, no accordion/interaction - Disclosure and How it works, the two variants not picked, are unchanged and
    still live in the lab as the record of what was considered, per the "never delete an explored direction"
    convention). Guide rows and their copy are ported verbatim from the lab (the real Knowledge Centre categories
    from `/pages/biodata-home`, one real link to that page's own section - no fabricated per-guide pages).
  - **Wired into both `dashboard/page.tsx` and `project-list/page.tsx`'s `isPublicUser && (activeSection === "Home"
    || activeSection === "Projects")` branch** - the same aside renders for both sections (only the eyebrow label
    differs, matching the lab exactly), and only Home also gets the gradient card above the real
    `DataOverviewContent` - Projects renders the real `ProjectListContent` directly under the aside, same as the lab
    and the "features reduce, they don't change fundamentally" decision this persona already follows.
  - **A new `guestDashboardTab` state** in both files drives `DataOverviewContent`'s controlled `activeTab`/
    `onActiveTabChange` props, separate from the existing `homeTab` state (registered-user's My BioData/Flora-
    Dashboard switcher, which doesn't apply to a guest) - so the gradient card's copy changes with whichever Flora
    and Fauna Dashboard tab (Overview/Flora/Fauna/Projects) the guest is actually on.
  - **Not changed**: the header's "Add project"/"Upload dataset" stay visible with the real `GuestActionButton`
    sign-up-invite behaviour for `public-user`, same as registered-user's copy of the header - the lab's own
    `GuestHeader` predates the later decision to stop hiding these for guests entirely (see the "Stale note" under
    the `BiodataLandingPage` merge above) and was correctly *not* folded back in, since that would have been a
    regression, not a fold-in.
  - Verified live: `public-user` on `/pages/dashboard` shows the aside, the gradient card ("Every species record
    starts with a sighting"), and switching to the Flora tab both changes the Flora and Fauna Dashboard's own content
    and the gradient card's headline ("Found a plant that isn't on the map?") together; "Create a free account" opens
    the real sign-up modal with that tab's own copy. `public-user` on `/pages/project-list` shows the same aside
    (eyebrow "PROJECTS") beside the real, unmodified Projects table, no gradient card. `registered-user` and
    `biodata-admin` on `/pages/dashboard` are unaffected (no aside change - they already had one via `HomeTabPanels`).
    `tsc`/`eslint` clean, zero console errors.

- **Sept 22 2026: `RoleSwitcher` stranded a preview on a whole-page access restriction instead of taking the user
  somewhere they could actually explore - fixed. Flagged directly by the user off a screenshot: switching to
  `public-user` while previewing a DSA record left them staring at "Data Sharing Agreements are managed by BioData
  Admins," not a bug in the access gate itself** ("It's good you have checks and balances but this is not the
  expected behaviour") - the gate was correct, the switcher's own navigation wasn't.
  - **Root cause**: `setRole` (`app/pages/_shared/role-switcher.tsx`) reapplied the newly picked role to whatever
    `pathname` the FAB happened to be opened on, unconditionally. For an ordinary page that's right - most controls
    are gated individually, the page itself stays visible (see `role-access.config.ts`'s own convention) - but
    `/pages/dsa/**` is the one route so far that's gated as a whole page (`DsaShell` swaps all of `main` for a
    restriction message when `hasFeatureAccess("dsaManagement", role)` fails), so previewing a blocked role there
    just re-rendered the same restriction under the new role instead of leaving the preview somewhere useful.
  - **Fix**: a small `wholePageGates` allowlist (`{ prefix: "/pages/dsa", feature: "dsaManagement" }`, one entry
    today) checked before navigating - if the target role fails that feature's check for the current path, `setRole`
    redirects to `/pages/dashboard` (Home, reachable and honest for every role) with a clean query string instead of
    carrying over params that mean nothing there (DSA's own `?status=`); otherwise it stays on the current path
    exactly as before. A direct visit to `/pages/dsa` by a blocked role is untouched - `DsaShell`'s own restriction
    message is still correct for someone landing on the URL itself (an old link, a bookmark); only the *switcher's*
    live-preview behaviour changed. Kept as an explicit short list rather than inferred from nav-tree membership -
    `project-detail`/`observation-detail` are real, unrestricted pages with no nav key of their own, so "not a nav
    key" isn't the same signal as "this role can't view it."
  - Verified `tsc --noEmit`/`eslint` clean, then a live Playwright pass across 4 scenarios: `biodata-admin` on a DSA
    record switching to `public-user` now redirects to `/pages/dashboard?userRole=public-user` (0 restriction
    messages, the guest gradient card renders); `biodata-admin` on `/pages/project-list` switching to
    `registered-user` stays on `/pages/project-list?userRole=registered-user` (both roles can view it, no unwanted
    redirect); a direct visit to `/pages/dsa?userRole=registered-user` still shows the restriction message unchanged
    (confirming only the switcher's own behaviour changed, not the gate); and `registered-user` on `/pages/dsa`
    switching to `biodata-admin` (who can manage DSAs) stays on `/pages/dsa?userRole=biodata-admin` with the real
    list content rendering - zero console errors across all four.
- **Sept 23 2026: `components/base/textarea/textarea.tsx` ingested (Untitled UI CLI), closing the "Purpose of Data
  Sharing" gap the DSA entries above log and the "Location Comment" gap `/test-site-details` logs.** `TextArea`
  composes the same shared `Label` and `HintText` (`components/base/input/label.tsx`/`hint-text.tsx`) `Input`
  already uses - its two real dependencies are those two shared files, not new ones of its own. `Label` already
  wraps `Tooltip`/`TooltipTrigger` (`components/base/tooltip/tooltip.tsx`), so `TextArea`'s own `tooltip` prop is
  the same already-shipped, already-audited Tooltip integration Input's `tooltip` prop uses - confirmed live (the
  `HelpCircle` trigger and its `text-fg-quaternary`/`hover:text-fg-quaternary_hover` classes render correctly in
  the doc page's SSR output) rather than assumed from the import alone.
  - **Attach primitives**: every class in `textarea.tsx` (`bg-primary`, `ring-primary`, `ring-brand`,
    `ring-error_subtle`, `ring-error`, `text-placeholder`, `autofill:*`) is the exact class chain `Input`'s own
    base field already uses, checked individually against the live `app/globals.css` - all real, all resolve, no
    dead classes shipped with this ingest. `font-barlow` was already present on the field wrapper (copied from
    Input's own pattern), so no gap there either.
  - **Doc page** (`app/(docs)/components/textarea/page.tsx`) follows the full template - Playground, Sizes,
    With hint text, **With tooltip** (added this pass - the doc page had the prop in its API table but no live
    section demonstrating it, so the Tooltip dependency wasn't actually shown working anywhere on the page; fixed
    to match `Input`'s own "With tooltip" section, plus a matching `tooltip` feature key in
    `config/design-system.config.ts` and the `ContextualConfigPanel` toggle list), Disabled, Invalid, API, Usage,
    an honest "not linked yet" Figma placeholder. Slotted alphabetically in both `lib/nav.ts` and
    `design-system.config.ts` (`tabs` -> `textarea` -> `toast`).
  - **`/pages/_shared/dsa/dsa-form.tsx`'s "Purpose of data sharing" field** now renders the real `TextArea`
    (`label`/`hint`/`isInvalid`/`rows`/`value`/`onChange`) in place of the `GapField` `?` marker, and
    `validateDsa` (`dsa-data.ts`) now requires it on submit - the `purpose` field and its seed data already existed
    (added when the DSA workflow first shipped, anticipating this ingest), so this closes the gap without touching
    the data model. `errorTab` already routed `purpose` to the "Agreement" tab, so the form's per-tab error count
    was correct with no further change. The deep-dive (`dsa-detail.tsx`) already rendered `dsa.purpose` with an
    honest "Not provided" fallback, so the whole path (form -> validation -> store -> deep dive) is now real
    end to end - verified live via a real `<textarea>` rendering on `/pages/dsa/new`.
  - **`/test-site-details`'s "Location Comment" `GapField`** (per the flow-through rule under "Generated screens"
    above) was swapped for the real `TextArea`, wrapped in the same `Inspectable` pattern every other real
    component on that screen uses (`textareaTokens`, mirroring `inputTokens` exactly since `TextAreaBase` shares
    the identical class chain). The now-unused `GapField` helper was deleted, the mapping table gained a
    "Free text (2000-word comment)" row, and the "New components identified" section's prose/gap-cards were
    updated to state that no component gaps remain on that screen (Radio and Textarea were the only two, both
    now resolved).
  - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, and a live pass via `curl`'d SSR output
    (no browser-automation tool was available in this session) confirming: the textarea doc page's Playground,
    Sizes, "With tooltip" section (real `HelpCircle` trigger with correct classes), Disabled, and Invalid sections
    all render real `<textarea>` elements with the expected class chain (including `ring-error_subtle` on the
    Invalid demo); `/pages/dsa/new`'s "Purpose of data sharing" field renders a real `<textarea>`; and
    `/test-site-details`'s "Location Comment" row renders a real `<textarea aria-label="Location Comment">` with
    no `?` marker left on the page. Full interactive hover/focus verification of the tooltip and resize-handle
    wasn't done in a live browser this pass (no automation tool available) - the wiring is otherwise identical to
    Input's already browser-verified Tooltip integration, so it inherits that verification rather than duplicating
    it blind.
- **Sept 23 2026: removed the "Custom Components" nav section (`lib/nav.ts`) and its one "Date range" entry, per
  direct user feedback that the section is deprecated.** Same precedent as the earlier "Marketing" nav-section
  removal above: the underlying page (`app/(docs)/custom-components/date-range/page.tsx`) and component
  (`components/custom/date-range/date-range-control.tsx`) are untouched and still real - `DateRangeControl` is
  still the live control filling the `GapDateRange` placeholder on both `/pages/dashboard` and
  `/pages/project-list`, so deleting it would break two real production screens, which isn't what was asked.
  Only the nav entry (sidebar + the generated `/llms.txt`, both driven by `lib/nav.ts`) is gone; the doc page is
  reachable by direct URL only now, same convention already used for `/pages/*`, `/test-*`, and the earlier
  FAQ-accordion page.
  - **`/llms.txt` is a generated route** (`app/(docs)/llms.txt/route.ts`), not a checked-in static file - it reads
    `staticNav()` off `lib/nav.ts` at request time, so it can never drift from the sidebar by construction. Verified
    live after this change: it lists `Textarea` under Components and no longer has a `## Custom Components`
    section at all - a 1:1 match with `lib/nav.ts` with no manual edit needed to the route itself.
  - **`README.md`'s own Components/Custom Components tables are hand-maintained** (see the Sept-earlier
    "documentation debt" entry above - this is the same file, same drift risk) and had already gone stale again:
    missing `Textarea` entirely and still carrying the now-removed Custom Components section. Regenerated both to
    match `lib/nav.ts` exactly in the same pass, rather than leaving `/llms.txt` correct while README quietly drifted.
  - Verified `tsc --noEmit`/`eslint` clean, and live: the sidebar/`/llms.txt` show 0 "Custom Components" hits,
    `/custom-components/date-range` still returns 200 by direct URL, and both `/pages/dashboard` and
    `/pages/project-list` (the real `DateRangeControl` consumers) still return 200 with the control unaffected.
- **Sept 23 2026: Data Licencing Agreement (DLA) workflow built at `/pages/dla`, following the same "List ->
  deep dive" shape as Projects/DSA, per direct instruction.** Source: the Master Flows wireframe (Figma
  `YMproGZfrFB5jUqPHPxMhk`, node `33:43259` - four sections: "No DLAs Yet", "Request/Renew - All Users",
  "View - All Users", "Approve/Reject - DEW Admin"). The wireframe's own numbered-circle stepper, its two-pane
  list/detail layout, and its "Add a Location" popup were all re-derived rather than copied - see the new "lo-fi
  is a starting point" contract above, which this build is the second worked example for (the DSA build above is
  the first).
  - **Confirmed with the user before building, not assumed:** (1) **Access-tier numbering** - the wireframe's own
    "Level 2 - Standard Access"/"Level 3 - Enhanced Access" per-location choice is now the real model: Level 1
    (public, no DLA - already shipped, unchanged) / Level 2 (a standard DLA) / Level 3 (an enhanced DLA, for
    sensitive-species data). The already-shipped "View Level 2 Project Data (DLA Access)" nav copy
    (`lib/registered-user-nav.ts`) needed no change - it was already accurate under this model, since Level 2 is
    still "the DLA-licensed tier." (2) **The "Projects for Level 3 Access" checklist references our real
    projects** (`app/pages/_shared/project-list-content.tsx`'s own 4-project array, re-exported as
    `dlaLevel3Projects` in `dla-data.ts`), not the wireframe's fictional category names ("Threatened Species
    Monitoring", ...) - so a DLA request points at an actual record in the system. (3) **"Add a Location"'s
    Upload Shapefile method gets a real parser** (`shpjs` + `proj4`, both added as real dependencies, not
    transitive-only) rather than an honest stub or a `?` gap - this closes the loop on an earlier open question
    (an npm-shapefile-reader lookup from a prior session, never acted on until now). (4) **DLA is for every
    signed-in role except `public-user`** (`registered-user`/`privileged-user`/`privileged-admin`/`biodata-user`,
    plus the `biodata-admin` bypass) - a guest has no account to request or manage a DLA under, matching how DSA
    is scoped to admin-only for the opposite reason.
  - **"Add a Location" reuses Explore's own real map-search components for 3 of its 4 methods, not a rebuilt
    lookalike.** Every location this modal produces becomes the exact same `Boundary` (circle/polygon) type
    `app/pages/_shared/map-search/geo.ts` already defines, so `SAMap` (Leaflet + leaflet-draw) needs no new
    rendering path at all: "Draw on the Map" reuses `SAMap` directly (a drawn circle -> "Defined on Map", a drawn
    polygon -> "Defined Polygon", disambiguated by the boundary's own `kind`); "Choose from a List" reuses
    `SA_NATIONAL_PARKS` via a single-select `Select.ComboBox` (a fixed 15km circle around the park's real
    centroid); "Coordinates" adds a real Easting/Northing option alongside the existing Latitude/Longitude one (a
    1km pinpoint circle either way), converted via a real `proj4` call
    (`app/pages/_shared/dla/dla-geo.ts::eastingNorthingToLatLon`) against a single fixed UTM zone (GDA94/MGA Zone
    54, EPSG:28354 - covering Adelaide and most of the state's populated south-east) - an honest, documented
    simplification, the same "approximate, not full GIS" convention `SA_NATIONAL_PARKS`' own centroids already
    use, since real SA coordinates actually span zones 52-54. "Upload Shapefile" is the one genuinely new piece:
    a real `shpjs` parse (`.geojson`, a bare `.shp`, or a zipped shapefile `.zip`) reduced to a single boundary
    polygon (the first feature's outer ring only - holes and additional parts are dropped, the same simplification
    `Boundary`'s own polygon shape already has). The License Category (Level 2/3) radio and, for Level 3, the
    project checklist are deliberately **not** part of this modal - the wireframe places them on each
    already-added location row in the parent step, not inside "Add a Location" itself, so the modal only ever
    produces a location's name/method/geometry.
  - **List -> deep dive, same shell shape as DSA:** `/pages/dla` (a table of one status bucket, column 2 picks
    the bucket, a row links to the deep dive), `/pages/dla/<id>` (a real gradient card carrying the ID/requestor
    org/agreement period/status, a contextual banner per status, an Agreement Summary card with the numbered
    location list, a Details card with purpose/period/requestor, and Withdraw/Approve/Reject at the bottom of
    the content - matching the wireframe's own button placement rather than a top toolbar), `/pages/dla/new`
    (the 3-tab form: Location & License / Details & Purpose / Review & Submit). One `DlaShell` component
    (`app/pages/_shared/dla/dla-shell.tsx`), one module store (`dla-store.ts`, `useSyncExternalStore`, same
    "resets on reload" convention as `dsa-store.ts`).
  - **Real, deliberate departures from the wireframe, each logged here rather than guessed at silently:**
    - **No "Save draft."** The wireframe's own 3-step form has no draft action anywhere in it (unlike DSA) - it
      goes straight from Review & Submit to a submitted request, so `submitDla` always sets a new request to
      Under Review, full stop.
    - **A fifth status bucket, "Withdrawn," that the wireframe's own list tabs never draw.** The wireframe shows
      a "Withdraw" link on both the Active and Under Review detail views but only ever draws 4 list tabs (Active/
      Under Review/Rejected/Expired) - a request a user or admin actually withdraws has to land somewhere, and
      folding it into "Rejected" would misrepresent a voluntary withdrawal as an admin decision. `dlaStatusOrder`
      is `active, under_review, rejected, expired, withdrawn`.
    - **One status label, not two.** The wireframe's requester-facing list says "Under Review"; its admin-facing
      list says "For Review" for the identical bucket. Unified to "Under Review" everywhere (list, column 2,
      banners), the same "one stored status, no per-persona relabelling" principle DSA's own Active/Inactive/
      Revoked/Drafts already follows.
    - **Adding a location to an already-Active agreement appends directly** (`addDlaLocation`), no separate
      per-location approval sub-flow - the wireframe shows a "+ Add Location" button on the Active view but never
      models what happens to that new location's own review state, so this build treats it as a same-session,
      honest mutation rather than inventing an amendment-approval flow nothing in the wireframe asks for.
    - **"Renew Licence" creates a brand-new request, never edits the expired one in place** - `/pages/dla/
      new?renewFrom=<id>` pre-fills locations/purpose/requestor from the expired record, so the expired record's
      own history stays intact and the new one starts a fresh Under Review cycle, the same "renewal is a new
      record" precedent DSA doesn't need but this workflow's own "Request/Renew" wireframe section name implies.
  - **Nav/access wiring:** `DLA_SECTION_LABEL` (`lib/registered-user-nav.ts`) is now a keyed leaf (`key: "dla"`)
    like Home/Projects/Explore/DSA, replacing the old inert `items: [{label:"Request New DLA"},{label:"Manage
    DLA"}]` text - those two "items" were really the same list/create split Projects and DSA already collapse
    into one screen, not two separate destinations. `biodataAdminNav`'s own special-case for DLA (which used to
    override its `items` to admin-specific text) is gone too - admin gets the identical keyed leaf, and
    "Approve Reject DLA Requests"/"Withdraw DLA" are real actions inside `/pages/dla` itself (gated by the new
    `dlaApproval` feature, admin-only via the bypass), not a second nav entry, the same call already made for
    DLA's own list/create actions. `config/role-access.config.ts` gained `dlaAccess` (every role but
    `public-user`) and `dlaApproval` (admin-only). `app/pages/_shared/role-switcher.tsx`'s `wholePageGates`
    gained `{ prefix: "/pages/dla", feature: "dlaAccess" }`, the same whole-page-gate redirect fix already applied
    to DSA - switching to `public-user` while previewing a DLA record now redirects to Home instead of leaving a
    restriction message stranded mid-preview.
  - **Verified live via a real Playwright pass** (chromium installed for this session, run against the existing
    dev server, then removed - not added as a project dependency): public-user correctly blocked from `/pages/
    dla`; the Active/Under Review/Rejected/Expired/Withdrawn views each render their correct banner and actions;
    an admin's Approve modal (real dates + a real `InputFile` attachment + the "Custom DLA" checkbox) moves a
    request to Active; Reject requires a reason (real `TextArea` validation) before confirming; "Renew Licence"
    from an Expired record correctly pre-fills the new form from that record's own locations; a full new-request
    submission (Add Location via "Choose from a List", setting Level 3 + a real project, filling Details &
    Purpose, agreeing to Terms, Submit) lands on the new request's own deep dive as Under Review with a
    correctly-generated sequential ID; and, separately, all three of Add Location's non-map methods were
    exercised directly - Easting/Northing (a real `proj4` conversion, confirmed it produces a plottable circle),
    and Upload Shapefile (a real 4-vertex test `.geojson`, confirmed `shpjs` parses it to 5 boundary points and
    the location is added with the correct "Uploaded Shapefile" badge). Zero console/page errors across every
    scenario. One testing-tool nuance hit and worked around, not a product bug: this codebase's `InputNumber`
    (react-aria's `NumberField`) only commits its parsed value to the controlled `onChange` on blur, not on every
    keystroke - a scripted `fill()`/`pressSequentially()` with no follow-up blur left the field visually correct
    but the boundary state still `null`; a real user's next click (e.g. pressing "Add Location" itself) always
    causes that blur naturally, so this only bit the automated pass, the same class of gap as this file's already-
    documented leaflet-draw hover-before-click nuance.
  - **`tsc --noEmit`/`eslint` clean** on every new/touched file (the `app/pages/_shared/dla/**` module, the 3
    `app/pages/dla/**` routes, `lib/registered-user-nav.ts`, `config/role-access.config.ts`,
    `app/pages/_shared/role-switcher.tsx`, `package.json`/`package-lock.json` for the new `shpjs`/`proj4`
    dependencies). A stray CLI regression on `components/base/tooltip/tooltip.tsx` (the same silent
    `font-barlow`/`text-balance`/focus-ring revert this file has already logged happening more than once from an
    unrelated ingest run earlier in this session) was caught via `git diff` and restored to `HEAD` before this
    build's own work continued, per the established "any CLI ingest can silently touch shared files, `git status`/
    `git diff` after every ingest is not optional" rule.
  - **Known gaps, not fixed:** the wireframe's own "Learn More" link on the Expired banner has no real
    destination anywhere in this build, so it was left out rather than faked with a dead link (only "Renew
    Licence," which is real, is shown). A location's geometry/method can't be edited after it's added to a
    request - only removed and re-added - since `AddLocationModal` is add-only by design (matching the
    wireframe, which shows no location-editing affordance either).
- **Sept 23 2026: DLA deep dive restructured, per direct UX critique ("a really weird withdraw button sitting at
  the bottom, the information isn't making sense... you're the admin, how would you want to see info
  arranged?").** The wireframe's own placement (Approve/Reject/Withdraw at the bottom of the content, after
  everything else) had been kept largely as-is in the first build - reasonable-looking on paper, wrong once an
  admin actually has to use it: the one thing they open an Under Review request to do sat below a full scroll of
  read-only content.
  - **Every action moved into the toolbar, always visible, none of it behind a scroll:** Download PDF, Withdraw,
    and (Under Review + `dlaApproval`) Reject/Approve now all sit next to "Back to requests" - the same "the
    primary action lives where you land, not at the end of the page" principle DSA's own Edit/Revoke toolbar
    already follows. Withdraw is `link-destructive` when it's the requester's own only action (Under Review) and
    `secondary-destructive` once it's a real toolbar peer next to Download PDF (Active) - quieter when it's the
    one thing on the page, more present once it's sharing space with other real actions.
  - **Content reordered to who/why/how-long, then what, then the outcome**: "Purpose of Data Use" + "Requested
    Agreement Period" + "Data Requestor" now come first (previously last), "Data Locations & License Categories"
    second, and the "Agreement" card (grant period + signed file - only for Active/Expired, the actual granted
    outcome) last. Reading top to bottom now answers "who's asking and why", then "what are they asking for",
    then "what did we actually give them" in that order, for every role landing on the page, not just admin.
  - **The gradient card's "Agreement Period" no longer reads as a data gap on a request that hasn't been granted
    yet** - it was a bare "Not set" for Under Review/Rejected, even though the requester had specified a period;
    it now falls back to the requested period with an explicit "(requested)" suffix, only saying "Not set" when
    genuinely nothing was entered.
  - **Banner copy neutralised - no longer written only in the requester's voice.** "Your DLA application is being
    assessed... you'll be contacted" was shown verbatim to the admin who was supposed to act on it, which doesn't
    make sense read as an instruction to *them*. The Under Review banner now branches: an admin with
    `dlaApproval` sees "This request needs a decision - see Approve/Reject above" (pointing at the toolbar that's
    now actually there), everyone else sees a neutral "This request is being assessed. The requester will be
    notified once a decision is made." The Expired banner dropped "Your data licensing agreement ... was expired"
    for a plain "This agreement expired on [date]" - true regardless of who's reading it.
  - **`/better-layout` isn't a skill in this session** (checked the available-skills listing before responding) -
    this restructure was done as a direct manual UX critique + rebuild instead, not a skill invocation.
  - Verified `tsc --noEmit`/`eslint` clean, and live via Playwright (installed for the session, then removed):
    the admin's Under Review view shows Withdraw/Reject/Approve in the toolbar and the decision-pointing banner
    text; the same request as the requester shows only Withdraw and the neutral banner; Active shows Download
    PDF + Withdraw as toolbar peers; Expired keeps its Renew Licence banner CTA with no Withdraw (correctly
    gated off once a request is no longer Active/Under Review); a full Approve action from the new toolbar
    button still correctly moves a request to Active. Zero console errors across every scenario checked.
- **Sept 24 2026: `AlertFullWidth` (`components/application/alerts/alerts.tsx`) shipped a real bug that had
  already landed in production - a stray border/background line under every "contained card" instance,
  caught via `/proto/collection-sidebar`'s own new banners** (see the "Section header, then search, then
  table" contract above for that build) but not introduced by them. The component's outer wrapper always
  renders `border-t border-primary bg-secondary md:border-t-0 md:border-b` - correct for its default
  full-viewport-width banner look, but every caller that overrides the inner `className` to look like a
  self-contained bordered card (`dla-detail.tsx`'s 4 status banners: Under Review/Rejected/Withdrawn/
  Expired, all using `className="max-w-none rounded-lg border border-{color}-200 ..."`) still had the
  outer wrapper's own flat, unrounded `bg-secondary`/`border-b` bleeding out underneath the rounded card -
  flagged directly by the user off a screenshot ("what's with the stroke underneath?"). Fixed with a new,
  additive `contained?: boolean` prop (default `false`, so the component's default full-bleed look is
  unchanged for any caller that doesn't pass it) - when `true`, the outer wrapper drops its own border/
  background classes entirely, leaving the caller's own `className` fully in charge of the shape. Checked
  every real consumer before calling it fixed, per the sibling-file-grep rule: `dla-detail.tsx`'s 4
  instances and the new `/proto/collection-sidebar` banners all needed `contained` added (done);
  `dashboard-options`' `ContinueBanner` (`className="px-6"`, no border/rounding) and `observations/
  page.tsx`'s Level 1/2 banner (no `className` override at all) both genuinely want the default
  full-bleed look and were correctly left untouched. Verified live via `getComputedStyle` on both the
  proto's own banner and a real `dla-detail.tsx` "Under Review" banner - outer wrapper's
  `border-bottom-width`/`background-color` both compute to `0px`/transparent post-fix, only the inner
  card's own `1px` border remains. `tsc --noEmit`/`eslint` clean on all three touched files.
  - **Superseded for `/proto/collection-sidebar`'s own two banners, same day: `AlertFullWidth` was
    the wrong component for the job entirely, not just visually broken - "are you sure the alert
    component is the correct component? ... this is a classic violation of the design system,"**
    per direct feedback. Right the first time: `TaskItem` (`app/pages/_shared/home-dashboard.tsx`)
    already settled this exact question once, in its own doc comment - "The banner (`AlertFullWidth`,
    color="warning") is real but deliberately not used here: neither DLA requests nor species
    nominations need the user's action right now - both are 'submitted, waiting on someone else's
    review' - so an 'Action required' banner would misrepresent their actual state." An `Alert`
    communicates something about *this page's own current state* (every legitimate `AlertFullWidth`
    use in this codebase does exactly that: `dla-detail.tsx`'s own record-status banners, `observations`'
    own data-scope notice, `dashboard-options`' own continue-task strip) - a computed fact about
    *other* records, with its own status and a link elsewhere, is a `TaskItem`, not an alert.
    `TaskItem` was exported (was file-local to `home-dashboard.tsx`) and given one additive prop,
    `onActionClick` (alongside its existing `actionHref`), for a second real consumer whose action
    switches the current page's own view instead of navigating away - both are now real, working
    call sites, not a fork. `/proto/collection-sidebar`'s "Needs attention" and "Nearest to expiry"
    are now real `TaskItem` cards (a status `Badge` sourced directly from `dsaStatusMeta`/
    `dlaStatusMeta`, not invented copy) - the `AlertFullWidth`-specific `contained`/`actionType`
    fixes above no longer apply to this file at all, since it doesn't use the component any more;
    they stay correct and in place for `dla-detail.tsx`'s own legitimate usage. Verified `tsc
    --noEmit`/`eslint` clean and live: both cards render as real bordered `TaskItem` rows with a
    real status badge, "Review drafts"/"Review requests" switch the page's own status view with no
    navigation, "View agreement"/"View request" navigate to the real record - zero console errors.
- **Sept 24 2026: `/proto/collection-sidebar` consolidated to a single direction, per direct
  instruction ("Let the 'Actions' become the baseline... do not do anything to it").** The
  "Actions" variant (from the round above) is now the sole Baseline - `QuickCreateButton` and the
  plain `StatusNav`-mirror-only variant are dropped, not kept as dead code, since "Actions" had
  already won on its own merits across several rounds of feedback rather than being one option
  among equals. `ProtoPicker`/`VARIANTS` are gone too - a comparison widget with one entry compares
  nothing; reintroduce it once a real second variant exists (see below). Verified live: no picker,
  the real `Actions` group (Export CSV/Create report) and both `TaskItem` banners still render and
  work identically to before, `tsc --noEmit`/`eslint` clean.
  - **Two real directions queued for the next round, grounded in Mobbin research, not yet built -
    per direct instruction to research before building.** (1) **Status as tabs above the table**
    instead of the `StatusNavColumn` list - real precedent: Xero's "Quotes" (All/Draft/Sent/
    Declined/Accepted/Invoiced as tabs directly under the page title) and Remote's "Team's
    expenses" (Pending/Approved/Declined/All requests, same placement) - a well-established, common
    pattern, not a novel idea. (2) **A real view switcher in column 2** once status moves out of
    it - not another status list, but a genuinely different lens, the same shape as Home's own My
    BioData / Flora and Fauna Dashboard split. Employment Hero's "Goals" page (My Goals / Team
    Goals / Company Goals / Search Goals as tabs) is the closest real precedent for this exact
    personal-vs-org-wide axis. For DLA specifically, "My Requests" (submitted by the current user)
    vs. "All Requests" (every request, the admin/reviewer view) is a real, domain-accurate split - a
    request has a genuine submitter and a genuine reviewer, unlike a cosmetic re-grouping. DSA has
    no equivalent submitter/reviewer split (a single-persona, admin-authored collection), so whether
    it needs an equivalent switcher at all, and on what axis, is still an open question - not
    assumed symmetric with DLA just because the two collections share a shell shape.
- **Sept 24 2026: `/proto/collection-sidebar` grew the two queued directions above into real,
  side-by-side variants, per direct instruction ("make actions the baseline and come up with some
  variants from the above patterns") - `ProtoPicker` is back, comparing Baseline / Status Tabs / My
  Items.** Both real, shipped list components (`app/pages/_shared/dsa/dsa-list.tsx`,
  `app/pages/_shared/dla/dla-list.tsx`) gained two more additive, opt-in props alongside their
  existing `banner` - `statusTabs?: ReactNode` (rendered directly under `SectionHeader.Root`,
  before the empty-state/table branch) and `extraFilter?: (record) => boolean` (applied to the
  status bucket before search/pagination ever see it, so the header's count badge, the empty
  state, and pagination all stay honest about what's actually showing). Both default to
  `undefined` - every real `/pages/dsa` and `/pages/dla` route is unaffected.
  - **The corrected finding from the round above, verified directly rather than left as an
    assumption:** DSA does have a real submitter field after all - `dsa-data.ts`'s own seed data
    gives every agreement a real `requestedBy: DsaContact`, including Olivia Wyatt, the same
    placeholder-person convention DLA's `requestor` already uses. So "My Agreements"/"All
    Agreements" is exactly as real for DSA as "My Requests"/"All Requests" is for DLA - the earlier
    "still an open question" note was answered by actually reading the data, not by guessing.
  - **Status Tabs**: a real horizontal `Tabs`/`TabList type="underline" size="md"` row (matching
    project-detail's own `ContentTabs` usage exactly, not a bespoke build) replaces the
    `StatusNavColumn` list - column 2 becomes Actions alone, with no `mt-4 border-t` floating rule
    now that it's the only thing there (`DsaActions`/`DlaActions` gained a `withTopRule?: boolean`
    prop, default `true`, so Baseline's own layout is untouched).
  - **My Items**: a real vertical `Tabs`/`TabList orientation="vertical" type="button-brand"
    fullWidth` switcher in column 2 (`ScopeSwitcher`) - the exact same component/type/orientation
    as Home's own My BioData / Flora and Fauna Dashboard split (`app/pages/dashboard/page.tsx`),
    not a lookalike built from scratch. "Mine" filters to whichever contact's name matches "Olivia
    Wyatt" (`contactName(d.requestedBy)` for DSA, `requestorName(d.requestor)` for DLA) - the same
    "current signed-in user" placeholder this build already uses everywhere else. This variant
    carries Status Tabs' own change forward (status still needs a home once the switcher takes
    column 2), rather than stacking two nav lists.
  - **A real, previously-unnoticed bug in the shipped `Tab` component was caught during this
    build's own live verification, not invented for the lab: `{badge && (<Badge>...)}` in
    `components/application/tabs/tabs.tsx` is the classic React `0 &&` gotcha** - a real, valid
    `badge={0}` (an empty status bucket shown as a tab, e.g. "Revoked 0" on this exact screen) is
    falsy, so `&&` rendered the bare text "0" glued to the label instead of a zero-count pill,
    visible as "Revoked0" with no space. Fixed to `{badge != null && badge !== "" && (...)}`,
    correcting every consumer of `Tab`'s `badge` prop at once (this lab's Status Tabs, and any
    future real page that shows a zero-count status as a tab), not just this lab's own usage.
    Grepped for the same `count &&`/`.length &&` shape elsewhere in the codebase - no other
    instance found.
  - Verified `tsc --noEmit`/`eslint` clean on every touched file
    (`app/proto/collection-sidebar/page.tsx`, `dsa-list.tsx`, `dla-list.tsx`,
    `components/application/tabs/tabs.tsx`), then a live Playwright pass (installed for the
    session, removed after, `package.json`/`package-lock.json` confirmed unchanged): all three
    variants render for both DSA and DLA with zero console errors; Status Tabs' own tab click
    correctly filters the table (Drafts -> 1 row) with the corrected zero-count "Revoked 0" pill
    rendering properly; My Items' scope switch correctly narrows DSA to Olivia Wyatt's one active
    agreement (count badge 5 -> 1) and correctly shows DLA's own real, honest empty state ("No
    active agreements") for "My Requests" x Active, since Olivia Wyatt has no active DLA record in
    the seed data - the `extraFilter` -> empty-state path works end to end, not just the row-count
    path. `ProtoPicker` itself moved into the header (not a fixed bottom-right overlay) since that
    corner is already claimed by the dev-only Agentation feedback toolbar and `RoleSwitcher`'s FAB.
- **Sept 24 2026: Unified DSA/DLA status model, rolled straight into production per direct
  instruction ("it's sitting in a good spot now... let's roll these updates into production").**
  Source: a real business reference sheet ("DLA/DSA - users Workflow Status", a screenshot supplied
  directly) plus a follow-up Slack thread (Suresh Saicharan asking, Adith Mohan/Uma Shankar
  answering) that resolved every open question against it. DSA and DLA used to run two
  independently-invented status sets (DSA: Active/Inactive/Revoked/Draft; DLA: Active/Under Review/
  Rejected/Expired/Withdrawn) - both now share one real workflow, `app/pages/_shared/
  agreement-status.ts`'s `AgreementStatus`: **Draft -> Submitted -> Under Review -> (Approved /
  Auto Approve -> Active) or Rejected; Under Review <-> On Hold; Active -> Closed (auto on expiry,
  or manual); Cancelled reachable from anywhere before Closed.**
  - **Every open question from the sheet was answered directly, not guessed** - each one changed
    the model from what the sheet's numbering alone would have implied:
    1. **Approved is a real, visible status, not a momentary transition.** "If the Start Date of
       the DSA is in the future, the status shall remain as 'Approved'/'Auto Approved' until the
       date before it becomes active." Confirmed with a real worked example: DSA-2026-01415/
       DLA-2026-00510 both carry a `validFrom` in the future and correctly stay `approved` rather
       than jumping straight to `active`.
    2. **Submitted and Under Review are genuinely distinct, and the transition is a manual reviewer
       action** ("Once a reviewer clicks on a submitted request it changes to Under Review... shall
       assist reporting and notifications to reviewers for action") - not automatic, so both DSA
       and DLA gained a real "Start Review" button, not a same-step alias.
    3. **On Hold only applies during review, never once Active** ("will be used by reviewer to hold
       the review in cases where there is pending info from requestor... for active requests only
       cancel option can be used"). Both detail pages only ever show "Put On Hold"/"Resume Review"
       on Under Review, never on Active - Active's only workflow action is Cancel.
    4. **Cancelled is one status, not two** ("I can cancel my own DSA, Admin can also cancel my
       DSA") - who cancelled it is an audit detail this build doesn't track, not a second status;
       the button's own color (`link-destructive` vs `secondary-destructive`) still varies by
       whether it's the page's only action or a peer among others, same convention DLA's own
       Withdraw button already used.
    5. **"Revoke" is not a real status at all - confirmed legacy terminology** ("Revoke will be
       called cancelled. That term was used before WF stages were finalised.") DSA's old `revoked`
       bucket is gone entirely, folded into `cancelled` - not kept as a separate "compliance" axis,
       which is what the sheet's own side-annotation had originally implied before this was asked.
    6. **Sequence #7 is confirmed missing on purpose** ("Yes there was something there that was
       removed") - nothing invented to fill the gap.
  - **`agreement-status.ts`** is the single shared source: `AgreementStatus`, `agreementStatusOrder`
    (draft/submitted/under_review/approved/rejected/active/on_hold/closed/cancelled - the sheet's
    own sequence order, not an invented "healthiest first" ordering), `agreementStatusMeta`
    (label/tabLabel/badgeColor, reusing this build's existing 5-colour status palette - gray/brand/
    warning/error/success - rather than introducing new ones no other status badge in this codebase
    uses), and `effectiveStatus()` - the pure function computing Approved -> Active and Active ->
    Closed once a real date passes. `dsa-data.ts`/`dla-data.ts` now `export type`/`export` alias
    `DsaStatus`/`DlaStatus` and `dsaStatusOrder`/`dsaStatusMeta`/`dlaStatusOrder`/`dlaStatusMeta`
    straight from this file, so every existing call site across both features kept working
    unchanged - only the literal status values themselves needed updating, not every import.
  - **A real, previously-unnoticed `useSyncExternalStore` bug was caught live during verification,
    not shipped**: the first pass applied `effectiveStatus` inside `getSnapshot` itself
    (`() => resolve(dsas)`), which maps over the array and returns a brand-new reference on every
    single call - `useSyncExternalStore` requires a referentially stable snapshot between renders
    when nothing has changed, so this produced React's own "the result of getSnapshot should be
    cached to avoid an infinite loop" warning immediately followed by "Maximum update depth
    exceeded," crashing `/pages/dsa` and `/pages/dla` outright (confirmed via `page.on("pageerror")`
    in a live Playwright pass, not visible from a code read). Fixed by moving the resolution into
    `commit()` - a cached `resolved`/`seedResolved` reference that only recomputes when the store
    actually changes, exactly the pattern `useSyncExternalStore` expects. Fixed identically in both
    `dsa-store.ts` and `dla-store.ts`, the same "a bug caught in one file is often shipped in
    both" convention this file already applies elsewhere.
  - **DSA gained the full review pipeline it never had** (previously Draft -> Active in one step,
    no reviewer step at all) - `dsa-store.ts` gained `startDsaReview`/`holdDsaReview`/
    `resumeDsaReview`/`approveDsa`/`rejectDsa`/`cancelDsa` (replacing the old single `revokeDsa`).
    `approveDsa` needs no extra input at all, unlike DLA's own Approve - a DSA's `validFrom`/
    `validTo` are already fixed from the agreement's own form, so approving just compares that
    date to today and lands on `approved` or `active` directly. DSA has no separate requester-vs-
    reviewer persona to gate any of this behind - `DsaShell` already replaces all of `main` with a
    restricted message for every role but the one that can manage DSAs at all
    (`useFeatureAccess("dsaManagement")`), so every action is unconditionally available once
    `DsaDetail` renders; `DsaDetail`'s own toolbar is now a full set of direct buttons (matching
    DLA's own "every action in the toolbar, always visible" convention from the Sept 23 follow-up)
    instead of hiding Edit/Revoke behind a `Dropdown`.
  - **DLA gained two real capabilities it never had**: a genuine **Draft** status (the wireframe's
    own form had no draft step at all - `dla-store.ts` gained `saveDla`, mirroring `saveDsa`
    exactly, and a brand-new `app/pages/dla/[id]/edit/page.tsx` route, since a draft has to be
    editable to ever get submitted) and **Submitted as its own stage, distinct from Under Review**
    (previously `submitDla` put a new request straight into `under_review`). `dla-form.tsx`'s
    `DlaForm` gained the same `initial`/`onSaveDraft` split `DsaForm` already had (`renewFrom`
    stays a separate, additive case - pre-filling a *new* record from a closed one's fields, not
    editing that closed record in place) plus a `mode: "draft" | "submit"` on `validateDla` (a
    draft only needs the requestor's own organisation, the same "just enough to identify it" rule
    DSA's own draft mode already uses). `dla-store.ts` gained `startDlaReview`/`holdDlaReview`/
    `resumeDlaReview`/`deleteDla` (for a deleted draft) alongside the existing `approveDla`/
    `rejectDla`, and `cancelDla` replacing the old `withdrawDla`.
  - **A shared `RejectModal`** (`app/pages/_shared/agreement-modals.tsx`) replaces DLA's own
    previously-local one - DSA needed the identical "Under Review -> Rejected, reason required"
    modal once it gained the same review step, so it's now one real component both import instead
    of two copies of the same ~35 lines.
  - **Status icons and list-bucket subheadings/empty-state copy rewritten for all 9 statuses** in
    both `dsa-shell.tsx`/`dla-shell.tsx` (icons: `Edit05`/`Send01`/`Clock`/`PauseCircle`/
    `CheckCircle`/`XCircle`/`CheckCircle`/`SlashCircle01`/`MinusCircle`, the same set both shells
    now share) and `dsa-list.tsx`/`dla-list.tsx`/`dsa-detail.tsx`/`dla-detail.tsx`'s own
    subheading/emptyCopy maps - no status left with stale Active/Inactive/Revoked or Active/Under
    Review/Rejected/Expired/Withdrawn-era copy.
  - **Seed data enriched with real examples of every new status**, not left undemonstrated: DSA
    gained 6 new agreements (Submitted/Under Review/On Hold/Approved/Rejected/Cancelled, its 2 old
    `inactive` rows converted to `closed` since both already had a `validTo` in the past) and DLA
    gained 4 (Draft/Submitted/On Hold/Approved, its old `expired`/`withdrawn` rows renamed
    `closed`/`cancelled` directly). Every new record follows this build's own established
    conventions - real BDBSA partner orgs, the Olivia Wyatt/Maya Dewitt/Phoenix Baker/Lana Steiner
    placeholder persona set, real South Australian national parks for DLA locations - never
    invented names or orgs.
  - `/proto/collection-sidebar`'s own `dsaStatusIcons`/`dlaStatusIcons` maps (built for the earlier,
    narrower status sets) now point at one shared 9-status `statusIcons` map, matching the two real
    shells exactly - the lab would otherwise have failed to type-check the moment `DsaStatus`/
    `DlaStatus` became aliases of the same shared `AgreementStatus` union.
  - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, then an extensive live
    Playwright pass covering both features end to end: all 9 status buckets and their real seeded
    counts confirmed on both `/pages/dsa` and `/pages/dla`; a full DSA transition walk (Submitted ->
    Start Review -> Under Review -> Put On Hold -> On Hold -> Resume -> Under Review -> Approve ->
    correctly landed on Approved, since that record's own start date is in the future) plus a
    separate Reject flow (Under Review -> a required reason -> Rejected) and a full create -> Save
    draft flow; the identical DLA transition walk, including the Approve modal's own live copy
    correctly announcing "moves to Approved and becomes Active on [date]" before confirming, and a
    full create -> Save draft -> Edit draft -> Add Location -> Back flow exercised through real
    in-app navigation (not repeated `page.goto()` calls, which would have reset the in-memory store
    - the same "client nav keeps state, a full reload resets it" convention this build's stores
    already document) - zero console errors across every scenario. Chromium/Playwright installed
    for the session only, removed after; `package.json`/`package-lock.json` confirmed unchanged.
- **Sept 24 2026: `/proto/collection-sidebar`'s "Actions" group and its two column-3 banners
  folded into the real `/pages/dsa`/`/pages/dla` shells, per direct instruction ("we should fold
  actions into production, please").** Only the unified status model had been rolled into
  production so far - the Baseline variant's own "Actions" (Export CSV / Create report, plus the
  "Drafts to finish"/"Requests awaiting review" and "nearest to expiry" `TaskItem` banners) was
  still lab-only until this pass, confirmed by grepping `dsa-shell.tsx`/`dla-shell.tsx` for
  "Export CSV" before starting (zero hits).
  - **New shared file `app/pages/_shared/agreement-actions.tsx`** - `downloadCsv` and
    `ActionsGroup` (the "Actions" label + Export CSV + Create report block), ported verbatim from
    the proto's own styling (`shortcutRowClassName`, the `border-t` divider). Each shell still
    supplies its own CSV export via `onExportCsv`, since the columns genuinely differ between an
    agreement and a request - only the wrapper/label/button styling and the "Create report" toast
    are shared.
  - **`nearestToExpiry`** (the 60-day-window helper behind the expiry banner) moved from the proto
    into `agreement-status.ts`, alongside `effectiveStatus` - the natural shared home now that a
    real production consumer exists too, not just the lab.
  - **`StatusNav` in both shells renders `<ActionsGroup>` directly after the status list**, inside
    the same `<div className="flex flex-col gap-1">` root (not a sibling under the aside's own
    `justify-between`, which would have pushed it to the bottom next to `FooterLinks` instead of
    right under the status list) - real navigation/real data throughout, no lab-only local state:
    `onExportCsv` calls the real `downloadCsv` against `useDsas()`/`useDlas()`'s own live array.
  - **`DsaBanner`/`DlaBanner` exported from `dsa-list.tsx`/`dla-list.tsx`** (co-located with the
    `banner` prop they fill, per that file's own convention) instead of staying page-local like the
    proto's version - both are now fully self-contained (`useDsas()`/`useDlas()`, `useRoleHref()`
    internally), so `app/pages/dsa/page.tsx`/`app/pages/dla/page.tsx` only need
    `banner={<DsaBanner />}`/`banner={<DlaBanner />}`, no props to thread through. The proto's own
    `onViewStatus` local-state callback is gone entirely - production has a real `?status=` URL, so
    "Review drafts"/"Review requests" are real `actionHref` links (`roleHref("/pages/dsa?status=
    draft")`) instead of a simulated in-page switch, simpler than the lab's own version needed to
    be.
  - **Ported as-designed, not redesigned for the new status model** - `DsaBanner` still keys off
    `draftCount` (DSA's own requester-facing action) and `DlaBanner` still keys off `under_review`
    count (the reviewer's own queue), the same two conditions already tested in the lab. Both are
    still real, valid triggers under the new unified workflow (Draft and Under Review are both
    still real statuses) - extending this to also flag `submitted` records (now a distinct,
    genuinely actionable "needs someone to Start Review" state that didn't exist when this banner
    was designed) is a reasonable next step but wasn't done here, since it wasn't part of what was
    being folded in - logged here rather than silently added.
  - Verified `tsc --noEmit`/`eslint` clean on every touched/new file, then a live Playwright pass
    on both real production pages (not the lab): confirmed "Actions" renders below the full 9-status
    list on both `/pages/dsa` and `/pages/dla`, clicking "Export CSV" fires a real file download
    (`data-sharing-agreements.csv`/`data-licencing-agreements.csv`, not a dead button), "Create
    report" fires the real "not wired up yet" toast, and the "Drafts to finish"/"Requests awaiting
    review" banners render correctly above the search bar on each page's default (Active) view with
    the correct real counts - zero console errors either page. Chromium/Playwright installed for
    the session only, removed after; `package.json`/`package-lock.json` confirmed unchanged.
  - **Follow-up, same day: the "Actions" label's own spacing to its first row didn't match the
    status list's, flagged directly by the user off a screenshot.** Two separate bugs, not one:
    (1) `ActionsGroup`'s label used `mb-1 px-2` (copied from the proto's own `GroupLabel`) while
    `StatusNav`'s "Agreements"/"Requests" label uses `mb-3` with no horizontal padding - fixed to
    match exactly, in both the real `agreement-actions.tsx` and the proto's own `GroupLabel`
    (same bug, same fix, both files). (2) Matching the label's margin alone wasn't enough - the
    status list's real label-to-first-row gap is `gap-1` (4px, from `StatusNav`'s own `flex
    flex-col gap-1` wrapper) *plus* the label's `mb-3` (12px) = 16px, not 12px, so `ActionsGroup`'s
    wrapper needed the same `gap-1` too (measured live via `boundingBox()`, not eyeballed: 12px
    before this second fix, 16px after, matching the status list exactly on both `/pages/dsa` and
    `/pages/dla` and in the proto). Caught and fixed while there: the proto's own `DsaActions`/
    `DlaActions` had a redundant inner `flex flex-col` div with no gap of its own, restructured
    into one `flex flex-col gap-1` wrapper matching `StatusNavColumn`'s shape exactly (also fixed a
    stray leftover closing `</div>` in `DlaActions` from that restructure). Verified `tsc --noEmit`/
    `eslint` clean and a live Playwright pass measuring real `boundingBox()` gaps (not assumed from
    the className) on `/pages/dsa`, `/pages/dla`, and `/proto/collection-sidebar` - all three now
    read exactly 16px for both the status-list and Actions label gaps, zero console errors.
  - **Follow-up, same day: "My Items"' single-status Tabs row replaced with a real status filter +
    a Status column, per direct instruction** ("All Agreements and My Agreements with the filters
    having all statuses. And the table having a status column"). "My Items"' whole point is that
    My/All is a *scope*, not a status bucket - it had still been showing exactly one status bucket
    at a time via the same `StatusTabsRow` "Status Tabs" itself uses, which didn't actually answer
    what a scope-only view needs: every status visible at once, filterable, with each row's own
    status legible in the table.
    - **`DsaAllStatusesTable`/`DlaAllStatusesTable`** (new, proto-local - not a change to the real
      `DsaListContent`/`DlaListContent`, same "build a local mirror for an unvalidated direction"
      precedent as `StatusNavColumn`/`StatusTabsRow`/`ScopeSwitcher` above) - `SectionHeader` +
      search + a real `StatusFilterSelect` (a `MultiSelect` offering all 9 statuses, empty
      selection = no filter = every status shown) + `TableCard`/`Table` with a real Status `Badge`
      column + numbered pagination - the full "Section header, then search, then table" contract,
      plus the filter. Column shapes mirror the real `DsaListContent`/`DlaListContent` closely
      (Agreement/Data partner/Status/Requested by/Updated; Request/Requestor/Status/Locations/
      Updated) with a live Status column standing in for what column 2 used to say.
    - **`statusInColumn3` narrowed to `variant === "Status Tabs"` only** - "My Items" no longer
      renders `StatusTabsRow` at all, and `dsaExtraFilter`/`dlaExtraFilter` (passed into
      `DsaListContent`/`DlaListContent`) were replaced with `scopedDsas`/`scopedDlas` (the My/All
      filter applied directly to the array before it ever reaches the new table), since "My Items"
      no longer renders those shared components in `main` at all.
    - Verified `tsc --noEmit`/`eslint` clean, then a live Playwright pass: DSA's table shows all 14
      seeded agreements across every status with a real Status column (confirmed each row's own
      badge text); "My Agreements" correctly scopes to Olivia Wyatt's 3 records; the status
      `MultiSelect` filter live-updates the table the instant a box is checked, confirmed with the
      popover still open (2 rows, both Closed) before ever closing it; DLA's own table (Request/
      Requestor/Status/Locations/Updated, 9 total rows, 2 for "My Requests") works identically -
      zero console errors throughout. One testing-tool nuance re-confirmed, not a product bug: this
      codebase's `MultiSelect` already documents that pressing Escape while its popover is open
      clears the selection instead of just closing it (a pre-existing, known gap logged elsewhere
      in this file) - hit again here by an early draft of the verification script, worked around by
      checking the live-filtered table state directly instead of relying on Escape to commit.
