# 2026-09 (undated) - Known gaps / loose ends from the Avatar build

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
