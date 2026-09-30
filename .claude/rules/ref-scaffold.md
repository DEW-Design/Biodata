---
paths:
  - "/components/**"
  - "app/*docs*/**"
  - "app/proto/**"
  - "app/_prototype-tools/**"
---

<!-- Moved verbatim from ref-ingest.md on 2026-09-29 so it loads wherever Scaffold is built (doc pages, labs, the Prototype tools bar). Hand-maintained: edit in place. -->

# Reference: DEW vs Scaffold

What is the product (DEW) and what operates or wraps it (Scaffold): doc-page controls, lab controls, the Prototype tools bar. Rules live in CONTRACTS.md (1.5, 2.2, 3.8); this is the reasoning behind them.

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
