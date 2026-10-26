# 2026-10-23 - Layout thrashing: an audit of animated layout properties, and the one switch fixed

- **Oct 23 2026: Layout thrashing: an audit of animated layout properties, and the one switch fixed.** The designer, with a screenshot of a card ("Layout thrashing: animating width, height, top, or left forces
  the browser to redo layout on every frame", a `width` demo beside a `transform` demo): "we need to fix layout thrashing across the webapp". Through `/refine-prompt`. The design vocabulary's term is "Transition
  property" ("Animating all properties can accidentally catch layout ones and cause jank. Opacity and transform are the safe pair"). The engineering glossary's "Layout thrashing" ("alternating style reads and writes")
  is a different mechanism that shares the name; the screenshot's meaning was taken, because it is also how the repo uses the phrase (`progress-indicators.tsx`: "Use transform instead of width to avoid layout
  thrashing"), and the JavaScript kind was measured separately. Assumed: "across the webapp" is the shipped code (`app/pages`, `components`, `app/_prototype-tools`); `app/proto` has no hit and is not shipped (5.4).
  - **The audit, every CSS or motion animation of a layout property in the shipped code (grep over `transition-[...]`, `transition-all`, `animate={{ height }}`, inline `transition`, nothing else found):**
    - `app/_prototype-tools/status-bar.tsx`, the on/off knob: `transition-[left,background-color]`. **Real and reachable on every screen with a toggle tool. Fixed.**
    - `components/base/accordion/accordion.tsx` (three variants, `animate={{ height: "auto" or 0 }}`, 13 importers): real, but the layout change is the point (what is below has to move). **Not changed, a decision.**
    - `app/_prototype-tools/status-bar.tsx`, the bar's width (`useMotionValue` width, 200ms, only for hide and show): real, a content-sized morph. **Not changed.**
    - `app/pages/project-registration/typeform-card.tsx`, the progress fill (`transition-all` on a percentage width): real in the code, **unreachable**. `Step1ProjectDetails` and `Step3PrivacyRestrictions`, the only
      files that render `TypeformCard`, are mounted nowhere since the Add Project option 2 sunset (`2026-10-23-01-*`); what is imported from those files is `ManagerCard`, `ChoiceTile` and the validators. Not changed.
    - `app/pages/project-detail/edit-drawer.tsx`, `transition-[max-width]` on the full-screen toggle: **a no-op.** A length cannot animate to `none`: measured in an isolated page, the width went from the first
      sampled frame straight to the end (1440, no frame between). The toggle snaps and always did. Not changed (a removal changes nothing visible).
    - `transition-all` in `components/base/input/input-number.tsx`, `input-group.tsx` and `components/scaffold/controls.tsx`: **latent, not thrashing.** The elements change focus ring, shadow and opacity, never a
      size. `input.tsx` and `textarea.tsx`, their siblings, use plain `transition`. Not changed.
  - **Fixed: the knob slides by `translate`, not `left`** (`translate-x-3`, the same 12px; `left-0.5` kept; `motion-reduce:transition-none` kept). Measured in a browser on the Add Project form, toggling "Pre-fill
    sample content": layouts per toggle **12 before, 3 (on) and 4 (off) after**; the knob's position per frame is the same sequence before and after (1077.9 to 1089.9, ten samples), so the easing, distance and
    duration did not change; computed `left` stays 2px and `transition-property` is `translate, background-color`.
  - **Measured, the accordion (the docs page, a light page):** 18 layouts on open and 34 on close, 1.8 and 4.6 ms of layout in total. The alternatives (a grid-rows transition, an `interpolate-size` height) are
    layout too; the only non-layout way is moving everything below it by transform, which is not practical. **Not measured on a heavy page** (a record panel with many cards).
  - **The JavaScript kind, traced** (Chrome trace, forced layouts only, a scroll, a window resize and six hovers per screen; a forced layout is one started from JavaScript):
    project detail 24 (16 inside react-aria's `checkVisibility` focus walk, 5 in Leaflet's `_updateLevels`, 2 in `project-tab.tsx` `useActiveItem`, 1 Playwright's own hover check), Explore 7 and Map visualise 8 (all
    Leaflet), projects list 3 (2 in the `agentation` feedback toolbar's scroll handler, 1 Playwright), reports 0. Nothing is read and written in a loop; the only ours is the project page's scroll-spy, two forced
    layouts in 48 wheel events, not worth throttling. Not changed.
  - **Open:** (1) the accordion: keep the height animation (recommended: it is the one place where layout is the effect) or take it to the designer as a different pattern; (2) whether to delete the unmounted
    wizard (`Step1ProjectDetails`, `Step3PrivacyRestrictions`, `TypeformCard`) and its dead progress fill, a deletion the designer decides (0.4); (3) whether `input-number` and `input-group` should match their
    siblings' `transition` (their focus ring is an outline width and offset, which plain `transition` would stop easing, so it needs an explicit property list); (4) layout counts are a proxy, not frame times, and
    these runs were on a fast desktop. Not verified: a low-end device, touch, the production build (the dev server was measured), the accordion on a heavy page.
  - **Checked:** `npx tsc --noEmit`, `npx eslint app/_prototype-tools/status-bar.tsx` (both exit 0) and `npm run check:contracts` clean; zero console errors on the form. Typography QA (0.6 item 8): no text changed.
    Not committed.
