# Colours and gradients cross-check, 29 Sept 2026

Source: the real "DS - Foundations" Figma file (`llQ4DndM7U0la4qg6MttC5`, footer-branded "Biodata SA Figma UI kit
and design system") - Colors (node `5225:371288`) and Gradients (node `1525:272676`), supplied directly. This is a
canonical foundations file, not an ad hoc frame - more authoritative than the scattered per-component frames earlier
Figma audits in this repo worked from.

## Method

`get_variable_defs` on both nodes (exact token-name to hex bindings, no eyeballing), then full-frame and per-row
screenshots to confirm layout, WCAG ratio badges, and read any swatch `get_variable_defs` didn't bind cleanly.
Cross-checked every value against `app/globals.css`'s `@theme` primitives.

## Confirmed correct, all 12 steps, exact hex match

- **Gray (light mode)** 25-900 - already known (the earlier "5 Figma frames" audit); step 950 addressed below.
- **Brand / Marine Teal** 25-950 - `--color-brand-*` matches exactly, including 500 `#2a667c` (the already-confirmed
  focus-ring value) and 950 `#041e27`.
- **Error, Warning** - all 12 steps each, exact.
- **Success** - all 12 steps confirmed exact, including 200 (`#abefc6`), which `get_variable_defs` had skipped and
  needed a dedicated screenshot of the row to read directly.
- **Seagrass Green** - Figma's own 12-step scale (25 `#f7fbfb` through 950 `#162d2d`) is already in this codebase,
  exactly, as `--color-accent-*` (`app/globals.css:58-69`, labelled "DEW Seagrass Green" in its own comment) - not a
  gap, just a different internal name for the same real palette.
- **Semantic text tokens** - `text-primary` (900, `#2e2925`), `text-secondary` (700, `#585451`), `text-tertiary`
  (600, `#706b68`) all match `--ui-text-primary`/`secondary`/`tertiary` exactly.
- **`bg-primary`/`bg-secondary`/`bg-brand-primary`/`bg-brand-secondary`/`border-secondary`** all match.

## Fixed: `--color-gray-950`

Was `#0C111D` (Untitled UI's stock cool-gray value, carried over unfixed since the original gray-scale audit, whose
own comment said "950 is unconfirmed... nothing in this codebase reads it"). Both halves of that were wrong: Figma's
Colors page gives a real, confirmed value (`#1a1715`), and the token is genuinely read by
`--ui-bg-primary-solid`/`--ui-fill-bg-primary-solid` - the near-black solid fill every `FloatingMenuFab` (role
switcher, layout options) uses. Fixed at the primitive, comment corrected. Verified live: the role-switcher FAB's
background computes `rgb(26, 23, 21)` (`#1a1715`) post-fix, zero console errors. `tsc`, `eslint`, `check:contracts`
clean.

## Not in this codebase at all: Flinders Violet, Horizon Blue

Figma's Foundations file documents two more full 12-step palettes alongside Brand and Seagrass Green - **Flinders
Violet** (700 `#5c5873`, 25 `#fafafb` through 950 `#1d1b24`) and **Horizon Blue** (700 `#517ea1`, 25 `#f8fafc`
through 950 `#192834`) - each appearing in the Colors page's "Secondary colors" section and in a named brand
gradient stop (`Flinders Violet 700 -> Horizon Blue 700, -135deg`). Neither exists anywhere in this repo - checked
by hex grep, not just by name. This is new scope, not a styling correction to something already shipped (the same
distinction CONTRACTS §1.4 draws for a new component): flagged, not added speculatively. Revisit if/when a real use
case names one of them (a third accent needed somewhere Seagrass Green and Brand don't already cover).

## Gradients

- The one real gradient this codebase uses, `bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%]
  to-brand-700` (identical across every gradient identity card - `record-hero.tsx`, `home-dashboard.tsx` x2,
  `guest-home.tsx`, `project-detail-view.tsx`, `project-details-view.tsx`), matches Figma's own named
  `Gradient/Brand/900 -> 800 -> 700 (0deg)` swatch in stops and direction sense. The exact stop-percentage geometry
  (the `63.942%` mid-stop) wasn't independently re-derived pixel-for-pixel - the named-token swatches this pass
  pulled don't expose raw gradient-fill geometry, only which two or three colour stops a gradient uses.
- The 7-swatch "Gray gradients" row (grayscale diagonal gradients, mostly 45deg) has no live consumer anywhere in
  this codebase - nothing to check against.
- One hardcoded gradient exists in product code: `biodata-home/page.tsx:716`,
  `bg-gradient-to-t from-[rgba(10,42,51,0.72)] to-transparent` - a text-over-photo legibility scrim on the hero
  image, not a UI-surface colour (Emil's own foundations skill: "Text over full-bleed images requires a scrim").
  Already counted in the existing hard-coded-colour ratchet baseline (`contracts/baseline.json`), not a new finding.

## A second, independent signal on the deferred D4 (`text-quaternary` contrast)

Figma's own Colors page prints a WCAG ratio on every swatch. Gray 500 (`#8f8b87`, `text-quaternary`'s primitive)
shows a bare "2.40" with no AA/AAA badge - that specific number is Figma's own "readable text on this swatch used as
a background" metric, not the same measurement as the type audit's live foreground-on-white check (3.4:1), so it
doesn't directly confirm the same number - but it's a second, independent source pointing the same direction (this
step of gray is a low-contrast colour by design intent, not an accident). Still logged as open in the type audit
(D4); not resolved here, per the designer's own "note it, come back later."

## Not committed

`--color-gray-950`'s fix is the only code change from this pass.
