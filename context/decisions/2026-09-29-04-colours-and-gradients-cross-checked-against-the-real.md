# 2026-09-29 - colours and gradients cross-checked against the real "DS - Foundations" Figma file

- **Sept 29 2026: colours and gradients cross-checked against the real "DS - Foundations" Figma file
  (`llQ4DndM7U0la4qg6MttC5`, footer-branded "Biodata SA Figma UI kit and design system"), per direct request -
  Colors (`5225:371288`) and Gradients (`1525:272676`). Report at `audit/colour-gradient-cross-check-2026-09-29.md`.**
  This is a canonical foundations file, more authoritative than the scattered per-component frames earlier gray/
  brand audits in this file worked from.
  - **Confirmed exact, all 12 steps each:** Gray (light mode), Brand/Marine Teal (including the already-confirmed
    500 `#2a667c` focus-ring value), Error, Warning, and Success (including 200, `#abefc6`, which `get_variable_defs`
    skipped and needed a dedicated screenshot to read directly). `text-primary`/`secondary`/`tertiary` (900/700/600)
    and `bg-primary`/`bg-secondary`/`bg-brand-primary`/`bg-brand-secondary`/`border-secondary` all match exactly too.
  - **Seagrass Green was already correctly ingested, just under a different name** - Figma's real 12-step Seagrass
    Green scale is already `--color-accent-*` in `app/globals.css`, exact hex match on every step; not a gap.
  - **Fixed: `--color-gray-950` was `#0C111D` (Untitled UI's stock cool-gray value), Figma's real value is
    `#1A1715`.** The old comment claiming "950 is unconfirmed, nothing reads it" was wrong on both counts - Figma
    now gives a real confirmed value, and the token is genuinely read by `--ui-bg-primary-solid`/
    `--ui-fill-bg-primary-solid` (the near-black solid fill every `FloatingMenuFab` uses). Verified live: the
    role-switcher FAB's background computes `rgb(26, 23, 21)` post-fix. `tsc`, `eslint`, `check:contracts` clean.
  - **Two entire named colour families in Figma's Foundations don't exist in this codebase at all: Flinders Violet
    and Horizon Blue** (each a real 12-step scale, confirmed by hex grep against nothing). This is new scope, not a
    styling correction to something already shipped - flagged, not added speculatively, per the same "a new
    component/token family is a designer decision" principle §1.4 already applies to components.
  - **Gradients:** the one real gradient this codebase uses (`from-brand-900 via-brand-800 via-[63.942%]
    to-brand-700`, identical across every gradient identity card) matches Figma's own named `Gradient/Brand/900 ->
    800 -> 700 (0deg)` swatch in stops and direction sense; the exact stop-percentage geometry wasn't independently
    re-derived (the named-token swatches don't expose raw gradient-fill geometry). The 7-swatch "Gray gradients" row
    has no live consumer anywhere in this codebase. One hardcoded gradient exists (`biodata-home/page.tsx:716`, a
    text-over-photo legibility scrim, not a UI-surface colour) - already counted in the existing hard-coded-colour
    ratchet baseline, not new.
  - **A second, independent signal on the deferred D4 (`text-quaternary` contrast, logged above):** Figma's own
    Colors page prints a WCAG ratio on every swatch, and Gray 500 shows a bare "2.40" with no AA/AAA badge - a
    different metric than the type audit's live foreground-on-white 3.4:1 check, but a second source pointing the
    same direction. Still logged as open (D4), not resolved here.
  - Not committed. `--color-gray-950`'s fix is the only code change from this pass.