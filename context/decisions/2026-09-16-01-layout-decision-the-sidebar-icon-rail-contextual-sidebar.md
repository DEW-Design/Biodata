# 2026-09-16 - layout decision: the sidebar (icon-rail + contextual-sidebar) shell is the

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