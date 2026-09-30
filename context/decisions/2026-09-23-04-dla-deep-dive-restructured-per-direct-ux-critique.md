# 2026-09-23 - DLA deep dive restructured, per direct UX critique ("a really weird withdraw button sitting at

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
  - **Twenty-fifth follow-up: a new "Species" results view, additive alongside the existing
    Projects/Events/Occurrences/Observations/Artefacts tabs, per direct request** ("I want a
    species search results page... Find a way if we can make a toggle view to view results as a
    species mode or Projects, Events, Occurrences, Observations and Resources leaving what we have
    accomplished already"). A new `Records`/`Species` toggle sits above the existing metrics-tile
    row, results-mode only - `Records` is the exact, byte-for-byte unchanged existing 5-tab
    experience (default on load); `Species` is entirely new.
    - **Structural reference**: Figma file `YMproGZfrFB5jUqPHPxMhk` ("Biodata Wireframe
      Presentation" - already this build's ground truth for the real Project→Site→Visit→Occurrence
      data model, see "BDBSA domain research" above), node `2266:175012`, three states of an
      "Observation_Map and Table View" component (`51:119524` base, `2266:167054` the "All
      Filters" panel open, `2266:170314` a compact state). A wireframe, not a styled reference -
      the filter categories (Family/Species/Information Authority/Timeline/Licence/All Filters),
      the count+Summary-toggle+export-icon toolbar row, the DLA notice's copy/structure, and the
      numbered pagination were all taken from it; every colour/token/component choice is this
      codebase's own.
    - **Species mode is a reframed, enriched view of the existing `SearchOccurrence` data, not a
      separate aggregation layer** - the wireframe's "Count" column turned out to mean a
      population/individual count per sighting, not a cross-record rollup, once cross-checked
      against this dataset's real `type: "Individual" | "Population"` field already present. Added
      `count` (Individual+Present → 1, Individual+Absent → 0, Population → a real species-
      appropriate estimate), `family` (real taxonomic families - Macropodidae, Tachyglossidae,
      Laridae, Pandionidae, Scincidae, Vombatidae, Dromaiidae, Megapodiidae, Psittaculidae,
      Pelodryadidae, Muridae, and 5 real plant families below - verified, not invented), `group`
      (`"Mammal" | "Bird" | "Reptile" | "Amphibian" | "Plant"`, backing the analytics tiles) and
      `licenceLevel` (`"Level 1" | "Level 2"`) to `SearchOccurrence`, mirrored onto
      `SearchObservation`. **Genus is deliberately not a stored field** - derived from the existing
      `species` binomial's first word at render/filter time, so it can never drift from the real
      name. A new `lastSurveyed` field (a real, later follow-up-survey date per row) backs the
      "Last Surveyed" column, and a new `siteNameForParentEventId` helper (search-data.ts) walks a
      record's real ancestor chain for the nearest `"Site"` event, backing "Site Name".
    - **Flora was entirely unrepresented before this pass** - every prior occurrence was fauna.
      Added 5 real South Australian native plant species (`occ-17`..`occ-21` + matching
      observations `obs-17`..`obs-21`), each parented under an existing real Site rather than a new
      Project, per this file's own "reuse real events, extend rather than fork" convention: Golden
      Wattle (*Acacia pycnantha*, SA's floral emblem, Fabaceae), South Australian Blue Gum
      (*Eucalyptus leucoxylon*, Myrtaceae), Grass Tree (*Xanthorrhoea semiplania*, Xanthorrhoeaceae),
      Quandong (*Santalum acuminatum*, Santalaceae), Lavender Grevillea (*Grevillea lavandulacea*,
      Proteaceae).
    - **`licenceLevel: "Level 2"` was assigned to 4 species that are genuinely threatened/vulnerable
      in real life** - Pygmy Bluetongue Lizard (Endangered), Malleefowl (Vulnerable), Orange-bellied
      Parrot (Critically Endangered), Yellow-footed Rock-wallaby (Vulnerable/Near Threatened) - not
      an arbitrary subset. A `"Level 2"` row's Coordinates cell shows a deliberately reduced-
      precision value with an explicit "± Nkm" label and a lock icon (5km for birds - a nest/roost
      site needs less spatial "room" to protect - 10km otherwise, both real examples the user's own
      ask named) via a new `obfuscateCoordinate` helper in `geo.ts` - snaps both lat/lon to the
      centre of a grid cell sized to the radius (deterministic, not random jitter, so a sensitive
      species' displayed location can never silently "wander" between renders). `"Level 1"` rows
      show the real, precise coordinate. This is the same real BDBSA mechanic already documented in
      this file's "BDBSA domain research" section, applied per-species instead of per-project.
    - **The DLA "records hidden" notice** (shown whenever the current search's own species results
      include any Level 2 rows) is a new bordered card, not `AlertFullWidth` (which only supports
      one CTA; the wireframe needs two side by side) - matches the wireframe's copy/structure
      exactly, keeps the same tone as the page's existing top-level DLA banner, and shares its real
      `requestDlaAccess` handler (pulled out of the existing `AlertFullWidth`'s own `onConfirm` so
      both call sites stay in sync) - `goToSection` to the real DLA nav item for a signed-in user,
      the real `GuestActionButton`/`SignUpPromptModal` invite modal for a guest. "Learn More" is
      honestly disabled with a "Coming soon" tooltip (no real DLA policy page exists in this build)
      via the same `Tooltip`+`Focusable`+disabled-`Button` convention already established by
      `DisabledQuickAction`/the old `GuestAuthActions`, never a fake `href="#"`.
    - **The analytics tile row** ("brief Analytics... Flora, Fauna, Mammals, Reptiles etc") is
      gated behind a real `Toggle` labelled "Summary" - this file's own interpretation of the
      wireframe's "Summary" switch, which shows no analytics row in either wireframe state;
      unifying the two readings was the right call rather than building two separate, competing
      "summary" concepts. Shows a Flora/Fauna split plus the 5-group breakdown, computed from the
      *currently facet-filtered* set (not including the tile row's own quick-filter, so clicking
      one tile doesn't zero out every other tile's own count); every tile doubles as a real quick
      filter (click to narrow, click again to clear). Reuses the exact non-reflow tile technique
      already established by the page's own `entityTabs` row (an absolutely-positioned active
      indicator, never a border-width change) rather than reintroducing the reflow bug documented
      there. **No taxonomy-appropriate icons exist anywhere in `@untitledui/icons`** (confirmed by
      search, not assumed) - the Flora/Fauna kingdom tiles use `Droplets02`/`Feather` as the closest
      loose association (same "a real icon standing in loosely, not literally" convention as
      `Feather` for "Nominate Sensitive Species" elsewhere in this nav), and the 5 group tiles use a
      plain coloured dot instead of forcing 5 more inappropriate icon choices onto real data.
    - **The filter chip row + "All Filters" panel** cover all 6 real categories the ask named
      (Family, Genus, Species, Information Authority, Timeline, Licence) - Genus has no top-level
      chip of its own (reachable only via "All Filters"), since it's one of two closely related
      taxonomic filters living together in the panel rather than needing a 6th chip. The panel
      itself is **left-anchored**, matching the wireframe exactly - `SidePanel`
      (`app/pages/_shared/map-search/side-panel.tsx`) gained an additive `side?: "left" | "right"`
      prop (default `"right"`, so its existing consumers - Customise columns, the record-detail
      sidebar - are untouched), the same "extend, don't fork" pattern already used for that
      component's `headerActions`/`widthClassName`. Species/Family are real searchable checkbox
      lists; Genus/Information Authority are plain checkbox lists (short enough not to need
      search); Licence is two checkboxes labelled exactly `"Level 1 - Public Access"`/`"Level 2 -
      Needs a DLA Access"`, matching the user's own wording; Timeline reuses the already-built
      `components/custom/date-range/date-range-control.tsx` (a "Filter by date identified"
      checkbox reveals it) rather than a new date picker - an honest note under it flags that this
      component's own selectable window (hardcoded 6 weeks back from today) may not reach every
      older record in a given search, a real, pre-existing limitation of the reused component, not
      something this pass could fix without touching a shared component beyond this feature's scope.
    - **Two real bugs found and fixed during the live QA pass, not caught by `tsc`/`eslint`**:
      (1) checking "Filter by date identified" showed an active chip and a real-looking date range,
      but silently filtered nothing at all - `DateRangeControl` only calls `onChange` once the user
      actively interacts with it (pick a day, step prev/next); passed no value, it falls back to
      its own internal uncontrolled default and never reports that default back up, so this
      component's own `dateRange` state stayed `null` and the `dateFilterOn && dateRange` guard
      never ran. Fixed by seeding a real default (the same current-week range the control itself
      shows) into `dateRange` the moment the checkbox is checked, so what's displayed and what's
      filtered can never silently disagree. (2) once that was fixed, a row dated exactly
      `2026-08-15` was still silently excluded from a selected "14 Aug - 15 Aug" range - comparing
      `new Date(o.date)` (a bare "YYYY-MM-DD" string, parsed as UTC midnight) against
      `CalendarDate.toDate(getLocalTimeZone())` (a timezone-aware instant) is off by a day right at
      a range boundary whenever the browser's timezone is ahead of UTC, which this app's own real
      Australian audience always is. Fixed by comparing pure calendar dates via
      `parseDate(o.date).compare(...)` instead, sidestepping timezones entirely. Both caught live,
      neither by `tsc`/`eslint` - a reminder that a date-range filter needs an actual positive-match
      browser check, not just a negative "does it correctly show nothing" one, the same lesson this
      file's own QA checklist already generalises from other features.
    - **Export (CSV/Excel/PDF), registered users only**, via a real `Dropdown` on the export icon
      button - a guest's click opens the sign-up invite modal instead of the menu (verified live,
      both the DLA notice's "Submit DLA Form" and the export button correctly branch per role).
      Always exports whatever's currently filtered/visible, not a fixed unfiltered set. All three
      formats are genuinely real with **no new npm dependency** (`app/pages/_shared/map-search/
      export-utils.ts`): CSV via a real Blob + a temporary `<a download>`; "Excel" via a plain HTML
      `<table>` served with the `application/vnd.ms-excel` MIME type and a `.xls` extension - a
      well-established technique Excel/Sheets/LibreOffice all open correctly, not a stub; PDF via a
      dedicated print-only popup window (`window.open` + `window.print()`, simpler and more
      reliable than an in-page `@media print` stylesheet fighting the live app's own scroll
      containers) so "Save as PDF" is a real, standard destination in the browser's own print
      dialog. A true `.xlsx`/binary-format library was deliberately not added just for this
      feature, per this build's own "don't add scope/dependencies without cause" judgement -
      logged as a deliberate choice, not an oversight. Verified live: the CSV/Excel dropdown items
      and the PDF popup (confirmed via its own document title, "BioData SA - Species Search
      Results") all fire correctly with zero console errors; actual on-disk file confirmation for
      CSV/Excel was blocked by this specific Chrome profile's own "always ask where to save
      downloads" setting producing a native OS save dialog outside browser-automation's reach - an
      environment property, not a defect in the export code, which uses the same standard technique
      either way.
    - **Scoped out, logged rather than silently dropped or silently built**: a Table/Grid toggle
      (Table is the one that matters, reusing `ResultsTable` - Grid would need its own card layout,
      not attempted this pass) and the wireframe's "Map" toggle (bringing the map back alongside
      the table in results mode - genuinely nice, not part of the explicit ask, no map-search-tool
      precedent for a split map+table results view yet either).
    - Verified `tsc --noEmit`/`eslint` clean on every touched/new file
      (`search-data.ts`/`geo.ts`/`side-panel.tsx`/`species-results.tsx`/`export-utils.ts`/
      `observations/option-1/page.tsx`) and an extensive live Chrome pass as both `registered-user`
      and `public-user`: a 296km search around -33.5,137.8 returning 10 real species (4 Flora/6
      Fauna, matching the Mammal/Bird/Plant group tiles exactly), the Mammal quick-filter tile
      narrowing to 4 and clearing back to 10, the obfuscated-coordinate lock icon and "± 5 km" on
      Malleefowl, the "All Filters" panel's Species checkbox and Licence section, both date-filter
      bugs' fixes confirmed with real positive and negative matches, guest export/DLA gating both
      opening the real invite modal, and `Records` mode confirmed completely unchanged for both
      roles - zero console errors throughout every check.

      - **Floating search panel over a full-width map, plus a "search areas" disclosure in the
        results header, per direct feedback.** Search mode's map now fills the whole area below the
        header; the boundary-method panel floats over it (top-left, clear of the map's own top-right
        zoom controls, `z-[1000]` since Leaflet's panes reach ~700) with a collapse button in its own
        header, collapsing to a "Search panel · N areas" pill. `SAMap` gained an optional
        `fitPaddingTopLeft` (forwarded to `flyToBounds`' `paddingTopLeft`) so fitted areas land clear
        of the open panel - every other `SAMap` consumer is unchanged. In results mode, "N search
        areas" in the subheading is now a toggle button (`aria-expanded`, chevron) that shows/hides
        one chip per area, using the same `boundarySummary` text as the search panel (park names for
        selected locations, lat/long for drawn/entered areas). Verified `tsc`/`eslint` clean and live:
        collapse/expand, two drawn circles fitted to the right of the panel, the areas disclosure
        listing both, zero console errors.
      - **Follow-up: the top bar folded into the floating card, a new minimised state, and
        shapefile upload as a 4th search method, per direct feedback.**
        - The separate "Search biodiversity records" header row is gone in search mode - its title
          and description are now the floating card's own header, so the map starts right under the
          page chrome.
        - The "Search panel" pill is gone. Minimising now folds the same card down to its header:
          title, a one-line status ("2 search areas defined", plus the keyword if set, or "No search
          area defined yet"), a primary "Search" button once areas exist, and a chevron to expand.
          The card stays in the same place instead of being swapped for a different control.
        - **Shapefile** tab (method labels shortened to Draw / Coordinates / Location / Shapefile so
          4 fit one row at 480px). Real client-side parsing via the new `shpjs` dependency
          (`app/pages/_shared/map-search/shapefile.ts`, with a minimal `shpjs.d.ts`): a .zip
          shapefile, the .shp with its .dbf/.prj picked together, or GeoJSON. A .prj reprojects to
          lat/long (so MGA/GDA shapefiles work when it's included); non-lat/long coordinates without
          one, line-only files, empty files and files over 500 locations are rejected with a
          specific message in the field's hint. Each file is one grouped search area (one list row,
          removed whole) expanded into real boundaries: a circle of a user-set radius (default 5 km)
          around each point, and each polygon's outer ring as drawn (holes ignored). Every location
          gets a map marker - points via the existing circle marker, polygons via a new marker at
          their vertex average (`sa-map.tsx`, shapefile-sourced polygons only).
        - `areaEntries` (page.tsx) is now the single "what counts as a search area" list, used by
          both the card's list and the results header's disclosure, so a shapefile counts once.
        - Verified `tsc`/`eslint` clean and live with two generated test shapefiles (4 points; 1
          polygon): both uploaded, 5 markers placed and fitted clear of the card, a search returned
          35 records across "2 search areas" listed by file name, and the minimised card showed "2
          search areas defined" with a working Search button - zero console errors.
- **`/pages/auth/**` - a real, working (no-backend, client-side-only) login/signup flow, built
  from a dedicated Figma reference (`https://www.figma.com/design/wer8CgO1UoCH3aQw2jQkdy/
  BioData-SA-High-Fidelity`, canvas `0:1` "Onboarding", frame `26:1410`), then wired into every
  existing "Log in"/"Sign up" entry point across the build. This reverses this file's own long-
  standing "no real auth/session in this exploratory build" convention for the auth *screens*
  specifically, per direct request - the rest of the app still has no real session/backend, this
  flow just gives the existing disabled buttons somewhere real to go, ending at
  `/pages/dashboard?userRole=registered-user` (the same URL-as-identity mechanism `RoleSwitcher`
  already uses to simulate "being" a role, extended here to simulate "being signed in").
  - **10 routes, one screen or wizard step each**, all under `app/pages/auth/**` (same `/pages/**`
    treatment as `biodata-home` - full-screen, own root, no doc-site chrome, not in `lib/nav.ts`):
    `login` (node `8:6183`/`41:324` - the second a password-only variant shown via `?email=`, used
    when arriving from `reset-success`), `signup` (`26:1471`), `verify-email` (`26:2338`, a real
    6-digit code input), `set-password` (`32:153`), `account-created` (`39:601`),
    `setup-profile` (`49:744`/`62:794`/`65:3159`, all 3 wizard steps in one route via `?step=`),
    `forgot-password` (`26:1411`), `check-email` (`39:555`), `reset-password` (`39:630`),
    `reset-success` (`39:704`).
  - **Three shared, page-local pieces** in `app/pages/auth/_shared/` (not promoted to
    `components/custom/**` - optional per that section, logged here as a candidate): `AuthShell`/
    `AuthHeader`/`AuthDivider` (the centred-card layout every screen reuses), `PasswordChecklist`
    (the live gray/green "must be at least N characters"/"must contain one special character"
    rows - `Set Password`'s Figma copy says 12 characters, not the 13 an early low-res read of the
    screenshot suggested; confirmed via the real per-screen `get_design_context` fetch), and
    `OtpInput` (a real 6-digit code control, 6 individually-controlled inputs with auto-advance/
    backspace/paste - no DEW OTP component exists, so this is composed from plain `<input>`s
    styled with real tokens, same "no match, no substitute" precedent as `DateRangeControl` before
    it was promoted).
  - **`SetupStepper`** (also in `_shared/`) reproduces the Figma wizard's dot-and-line progress
    indicator (complete/current/incomplete) from real tokens - no DEW stepper component exists
    either.
  - **Wired 3 real entry points, not just built the destination:**
    - **The 7 duplicated, per-file, disabled-with-tooltip `GuestAuthActions` components**
      (`dashboard`, `dashboard/option-2`, `project-list/option-1` and `option-2`,
      `project-detail/option-1`, `observation-detail/option-1`, `observations/option-1`) were
      collapsed into one shared, enabled `app/pages/_shared/guest-auth-actions.tsx` - real
      `Button href="/pages/auth/login"`/`href="/pages/auth/signup"`, no more tooltip/`isDisabled`.
      Same "fix the duplicated pattern once it needs a real behaviour change" precedent as this
      file's other consolidations (`SectionHeader`, the `font-barlow`/token fixes). Each of the 7
      files' now-unused `Focusable`/`Tooltip` imports were dropped where nothing else in that file
      still used them (checked per file, not assumed).
    - **`SignUpPromptModal`** (`app/pages/_shared/guest-action-gate.tsx`) - its "Log in"/"Sign up"
      buttons used to close the modal and fire a `toast.brand(...)` saying signup isn't built.
      Now that it is, they `router.push` to the real routes instead (closing the modal first).
    - **`biodata-home`'s header** - "Login" was `isDisabled` with a "Coming soon" tooltip and had
      no matching "Sign up" button at all (the one page in this build without one). Enabled and
      wired to `/pages/auth/login`; added a "Sign up" button next to it so every page in this
      build now offers both, matching the marketing page's role as the public entry point.
  - **Honest gaps, logged rather than silently dropped or over-built:**
    - The `check-email` (password-reset) screen's real Figma design has no in-app continue button
      at all - it assumes a real emailed link, which this no-backend build can't send. Added one
      small, explicitly-labelled dev-only link ("This preview has no real email delivery / Continue
      to reset your password") rather than silently faking a working email system - same honesty
      convention as `GuestActionButton`'s toast and `DisabledQuickAction`'s tooltip elsewhere.
    - The profile-picture upload on `setup-profile`'s "Your details" step is a real, working
      `<input type="file">` (shows the picked filename) with no real storage behind it - no backend
      exists anywhere in this build to upload to.
    - The Role/Organisation options offered on `setup-profile`'s "Organisation details" step reuse
      this file's own already-established real BDBSA partner names (Birds SA, BirdLife Australia,
      South Australian Museum, Adelaide Hills Landcare) rather than inventing new ones.
  - Verified `tsc --noEmit` and `eslint` clean on every new/touched file. Live Chrome pass covered
    both primary paths end to end: (a) sign up -> a real 6-digit code entry -> set password with
    the live checklist turning green per keystroke -> account created -> all 3 setup-profile steps
    (multi-row "Add" on Organisation details, both Setup 2 dropdowns populated from the real Select
    component, both Setup 3 checkboxes) -> landed correctly on
    `/pages/dashboard?userRole=registered-user`; (b) sign in -> forgot password -> check-email (the
    dev-only continue link) -> reset-password (live match/mismatch validation) -> reset-success ->
    "Sign in with new password" correctly rendered the password-only `Existing account` variant.
    All 3 wiring points (the shared `GuestAuthActions` on a `public-user` dashboard, the
    `SignUpPromptModal` triggered via "Add project", and the `biodata-home` header) confirmed
    landing on the real routes. Zero console errors across every screen checked.
  - **Follow-up: primary-affiliation selection on Setup 2 ("Organisation details"), first
    improvised (no Figma yet), then corrected against a real Figma reference the user supplied
    afterward - node 2504:57758, same file.** Each Role/Org row is its own `BentoCard` (this
    codebase's existing shared card shell, already used by `ContactCard`/`MetricCard` on
    `project-detail/option-1`) instead of a plain centred heading between horizontal rules - a
    real container per row, matching this file's own "repeated table shapes need distinct
    containers" design principle. A real `RadioGroup`/`RadioButton` (already-ingested
    `components/base/radio-buttons/**`) lets the user mark exactly one row "primary."
    - **First pass (improvised) guessed `border-brand-300`/`bg-brand-50` for the selected card and
      added a numbered circle badge + "Affiliation N" heading + a `BadgeWithDot` "Primary" pill +
      a text "Remove" link, and hid the primary control entirely at 1 row.** Once node 2504:57758
      was fetched, all of that was corrected to match the real frame: **`border-brand-500`**, not
      `-300` (Figma's raw swatch is `#2a667c` = brand-500, confirmed against this file's own
      brand scale - `bg-brand-50` was already right, `#edf7f9` = brand-50 exactly). **No numbered
      badge, no "Affiliation N" heading, no separate "Primary" pill** - Figma's row header is just
      the "Set as primary" radio (left) and an icon-only trash utility button (right); trimmed to
      match, per "Figma is the source of truth, full stop." The trash action is a real, icon-only
      `Button color="secondary"` (no `children`, so it renders through the component's own
      built-in icon-only mode - `data-icon-only:p-2` - rather than a bespoke one-off button),
      matching Figma's bordered/shadow-xs utility-button styling exactly; the earlier text
      "Remove" link is gone. **The "Set as primary" radio is now always shown, not hidden at 1
      row** - Figma's row template renders it unconditionally, and a real 1-row state isn't
      demonstrated in the frame either way, so this defers to Figma's template shape rather than
      the earlier invented rule. The trash button stays visible but **disabled** (not hidden) once
      only one row remains, since removing your only affiliation isn't a real action, but hiding
      it would break the row template's visual consistency Figma establishes.
    - Removing the current primary row still auto-promotes the next remaining row. First row still
      defaults to primary.
    - **New in this pass: selecting "Other" for a row's Role or Organisation/Institution (not in
      Figma - built per direct request) reveals a required text input directly under that select**
      (`Input label="Your role"` / `"Your organisation / institution"`), asking the user to name
      it. `RoleOrgRow` gained `roleOther`/`orgOther` string fields; `step2Valid` now also requires
      the matching "Other" field to be non-empty whenever that select reads `"other"`; switching a
      select away from "Other" clears its stored other-text rather than silently carrying stale
      hidden data forward.
    - Verified `tsc`/`eslint` clean and a live Chrome pass matching the corrected frame:
      screenshotted the single-row state side by side with the Figma render (radio + disabled
      trash, tinted primary card), selected "Other" for both Role and Organisation on the same row
      and confirmed both required text inputs appeared in the correct column with Continue staying
      disabled until filled, added a second row and confirmed the trash buttons both re-enabled
      and the "Other" text survived on row 1, zero console errors throughout.

- **`/pages/observations/option-1` gained a "Species" results view - a second, additive way to
  browse the same real occurrence data the existing Projects/Events/Occurrences/Observations/
  Artefacts tabs already show, per direct request ("a species search results page... leaving what
  we have accomplished already").** Reference wireframe: Figma file `YMproGZfrFB5jUqPHPxMhk`
  ("Biodata Wireframe Presentation" - the same file already treated as ground truth for this
  build's real Project->Site->Visit->Occurrence data model, see "BDBSA domain research" above),
  node `2266:175012`, three instances of an "Observation_Map and Table View" component
  (`51:119524` base state, `2266:167054` the "All Filters" panel open, `2266:170314` a compact
  state) - a wireframe, so it documented real IA/interaction shape only (which filters exist, what
  the table shows), never colour/spacing/component choice, per this file's own established rule
  for this specific reference file.
  - **A new "Species / Records" toggle** sits above the existing metrics-tile row in results mode
    - "Records" is today's exact, untouched 5-tab experience; "Species" is the new view, built in
    `app/pages/_shared/map-search/species-results.tsx` (`SpeciesResultsView`).
  - **Species mode is a reframed, enriched view of the real `SearchOccurrence` data, not a
    separate aggregation layer** - the wireframe's own "Count" column turned out to mean a
    population/individual count per sighting, not a rollup, once actually read closely. Added real
    fields to `SearchOccurrence`/`SearchObservation` in `search-data.ts`: `count`, `family`
    (genuine taxonomic families for every real species already in the dataset), `group`
    (`"Mammal"|"Bird"|"Reptile"|"Amphibian"|"Plant"`), `licenceLevel` (`"Level 1"|"Level 2"`, the
    same real BDBSA sensitive-species mechanic already documented above), and `lastSurveyed`.
    Genus is deliberately *not* stored separately - it's derived from the existing binomial
    `species` string at render/filter time (`genusOf`), since storing it would risk drifting from
    the real name. The two Non-Biotic/Community occurrence rows (never real species to begin with)
    are excluded from Species mode entirely via a `family && group` check.
  - **Flora was 100% unrepresented before this** - every existing occurrence was fauna. Added a
    handful of real South Australian native flora species (*Acacia pycnantha*, *Eucalyptus
    leucoxylon*, and others) as new `SearchOccurrence`/`SearchObservation` rows, parented under
    existing real Sites rather than inventing new Projects.
  - **Obfuscated coordinates for sensitive (Level 2) species** - `obfuscateCoordinate` (added to
    `geo.ts`) deterministically snaps a coordinate to the centre of a grid cell sized to a real
    5km/10km radius (birds obfuscate tighter, 5km; everything else 10km) rather than adding random
    jitter, so a sensitive species' displayed location never silently "wanders" between renders.
    The Coordinates column shows a lock icon + tooltip + the reduced-precision value with its own
    "± N km" label for Level 2 rows, the real precise value otherwise - visibly different, not
    silently different, per this build's own honesty convention.
  - **Filters**: Family, Genus, Species, Information Authority (derived from the record's root
    Project's real `org`, via the already-exported `rootProjectForParentEventId`), Timeline (a real
    date range, reusing the already-built `components/custom/date-range/date-range-control.tsx`
    rather than a new picker), and Licence.
  - **A "brief Analytics" tile row** (Mammal/Bird/Reptile/Amphibian/Plant breakdown, computed from
    the currently filtered set) toggled by a real `Toggle` labelled "Summary" - the wireframe's own
    "Summary" switch shows no analytics row in either of its states, so unifying it with the
    explicit "brief Analytics... Flora, Fauna, Mammals, reptiles Etc" ask was this build's own
    interpretation, documented as such rather than silently invented. Each tile doubles as a real
    quick-filter (click to narrow the table to that group, click again to clear).
  - **Export (CSV/Excel/PDF), gated to registered users** - all three genuinely real, no new npm
    dependency (`app/pages/_shared/map-search/export-utils.ts`, see that file's own header comment
    for the exact technique behind each: a real CSV Blob download, an HTML-table-served-as-`.xls`
    for "Excel", and a dedicated print window + `window.print()` for PDF). A guest's export click
    opens the same sign-up invite modal (`GuestActionButton`/`SignUpPromptModal`) this page already
    uses for "Add project"/"Upload dataset", not a hidden button.
  - **`SidePanel` (`side-panel.tsx`) gained an additive `side?: "left" | "right"` prop**, default
    `"right"` (every pre-existing consumer untouched) - Species mode's "All Filters" panel is the
    first real `"left"` consumer, matching the wireframe's own left-anchored panel.
  - **Logged gaps, not silently built or silently dropped**: a Grid/card view (Table/Grid toggle in
    the wireframe) and a "bring the map back alongside the table in results mode" toggle were both
    scoped out as candidate follow-ups, not built - Table mode (reusing the existing `ResultsTable`
    primitive) covers the actual ask; "Learn More" on the Species DLA notice is an honestly-disabled
    link with a "Coming soon" tooltip, since this build has no real DLA policy page yet.
  - **Follow-up, per direct UI feedback on the first pass ("UIs are not optimised for spacing and
    ... not consistent with the DEW design system... filters are not intuitive")**:
    - **Removed the Flora/Fauna kingdom split** that used to sit above the 5 taxonomic-group
      tiles - redundant once the Plant tile already carries the whole "Flora" total and the other
      4 groups sum to "Fauna".
    - **Every filter chip that used to open the full "All Filters" side panel for just one facet
      is now a real, inline `MultiSelect` dropdown living directly on the toolbar** (Family,
      Species, Information Authority, Licence - all real `components/base/select/multi-select.tsx`
      instances, not a hand-rolled popover) **or a small popover** (Timeline - a date range, not a
      discrete option list, so `MultiSelect` doesn't fit it; a `DialogTrigger`+`Popover` styled to
      match `MultiSelect`'s own trigger exactly). Only "All Filters" still opens the side panel -
      now a genuinely consolidated view across all 6 facets, not the only way to touch any single
      one. The inline dropdowns and the panel's own matching checkbox lists share the exact same
      state (`selectionToSet`, converting a `MultiSelect`'s `Selection` into the plain `Set<T>`
      every filter already used), so picking a Family in one place can never disagree with the
      other.
    - **The side panel's own accordion was reading FAQ-page-sized** (`Accordion`'s default
      `"divided"` variant - large titles, `gap-8` between items, a circle-glyph expand indicator
      meant for a wide marketing page, not a narrow filter panel). Added a third variant,
      `variant="compact"`, to the shared `Accordion` component (`components/base/accordion/
      accordion.tsx` - extending the one real component rather than forking a second, per its own
      established convention): `text-sm` titles, tight `py-2.5` header padding, thin dividers, no
      reserved FAQ-width content gutter, and a real `ChevronDown` (not the circle glyph) coloured
      `text-brand-600` per direct request ("chevron(color=brand primary)"). Both existing variants
      ("divided", "boxed") are untouched - purely additive.
    - Verified `tsc --noEmit` and `eslint` (zero warnings) clean on every touched file. A live
      Chrome pass was planned but the browser extension disconnected mid-session (likely tied to
      an account/session change during this conversation) and did not reconnect - flagged directly
      rather than silently skipped; a live re-verification is still owed once the extension is
      back.
    - **Second UI follow-up, per further direct feedback (still without a live Chrome pass - the
      extension stayed disconnected across this round too, flagged again rather than silently
      assumed fine):**
      - **New shared `MetricTile` component** (`app/pages/_shared/map-search/metric-tile.tsx`) -
        the Species view's taxonomic-group breakdown and the Records view's own Projects/Events/
        Occurrences/Observations/Artefacts switcher (`entityTabs` in `app/pages/observations/
        option-1/page.tsx`) used to be two independently-styled copies of the same "icon + label +
        count, click to filter" tile; per direct feedback to make the two visually identical, both
        now render through one real component so they can't drift. Selected state is a real
        border-colour + light-brand-background change (`border-brand-500 bg-brand-50` - the same
        "light brand BG, border colour = brand" language already established on the signup flow's
        primary-affiliation cards) rather than the earlier absolutely-positioned underline bar -
        since only colour changes now, not border width, the reflow bug that bar existed to guard
        against (documented at length in this file's own earlier entries) doesn't apply here; a
        pure colour swap can't change the tile's box height. This is a deliberate departure from
        the Records view's own Figma-matched flush/un-rounded/underline styling (node I209:27950),
        made per direct, explicit instruction to unify it with the Species view instead.
      - **Species mode's taxonomic-group tiles gained real icons**, replacing the plain coloured
        dot - `@untitledui/icons` has no literal animal/plant glyphs (confirmed by search, same
        finding this file already notes for the OccurrenceType icons), so each is a loose, honest
        stand-in per this build's established convention: Mammal -> `Fingerprint01`, Bird ->
        `Feather` (already this codebase's own bird-adjacent icon), Reptile -> `Hexagon01` (a
        repeating plated pattern, the closest honest stand-in for scales), Amphibian ->
        `Droplets02` (a real defining trait - water-dependent life cycle), Plant -> `GitBranch01`
        (a branching structure).
      - **Removed the bordered/padded card that used to wrap the Species analytics tile row** -
        per direct feedback ("no outside container for this, just the blocks would be enough"),
        matching the Records view's own tile row, which never had one.
      - **"Edit search" was its own direct child of `SectionHeader.Root`, 20px (the Root's own
        `gap-5`) above the "Search results" heading - read as an orphaned floating link, not "back
        navigation for this title."** Wrapped it together with the heading/subheading `Group` in
        one `gap-2` cluster instead, so the two read as one cohesive unit; `SectionHeader.Root`'s
        own `gap-5` (shared by every other consumer sitewide) is untouched, since it now only ever
        sees the one combined child. The page-level DLA warning banner's own position (above this
        header block) was left as-is - it was placed there per an earlier, separate explicit
        request ("on the top", see above), and this round's feedback didn't ask to move it.
      - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every touched file. No live
        Chrome pass was possible this round either - flagged to the user directly, asking them to
        check the result themselves or say when the extension is back up.
      - **Third UI follow-up, per detailed real Agentation feedback off the live page (still no
        live Chrome pass possible on this end - the extension stayed disconnected through this
        round too):**
        - **Active filter pills.** Every selected value across all 6 Species-mode facets (Family/
          Genus/Species/Information Authority/Timeline/Licence) now surfaces as its own removable
          "Filter name: value" pill in a row beneath the filter dropdowns, not just an implied
          "(N)" count on "All Filters" - one pill per selected *value*, not per facet, so a Family
          filter with 2 families picked shows 2 independently-removable pills. Built from the same
          state the dropdowns and the "All Filters" panel already share.
        - **Filter dropdown widths.** The 5 inline filter controls were genuinely compressed
          (`w-36`/`w-48` at `size="sm"`) - widened to `size="md"` with real per-field widths
          (Family/Species `w-48`, Information Authority `w-64` since it's the longest label,
          Timeline `w-44`, Licence `w-52`).
        - **Removed the redundant "N species records found" text** from the Summary/export bar -
          the page-level header above `SpeciesResultsView` already states the same count.
        - **Group tile icons: `lucide-react` added as a real, new npm dependency**, per direct,
          explicit authorization ("free to use relevant icons from online, not necessary to stick
          with DEW design system") - the one deliberate exception to this build's usual DEW-icon-
          only rule, scoped to exactly these 5 tiles. Mammal -> `PawPrint`, Bird -> `Bird`, Reptile
          -> `Turtle` (all three literal, unambiguous matches - lucide has real animal icons where
          `@untitledui/icons` has none at all); Amphibian has no literal icon in lucide either
          (confirmed by search) so `Droplets` stands in for the real defining trait (a water-
          dependent life cycle), same honest-substitute reasoning as everywhere else in this
          build; Plant -> `Leaf`, literal.
        - **Records/Species view-mode toggle relocated.** It used to sit in its own full-width row
          between the header and the metrics tiles - an awkward, disconnected spot per direct
          feedback. Moved into `SectionHeader.Actions` (that slot's own established purpose -
          trailing header content, already used this way in `app/pages/_shared/data-overview.tsx`
          and elsewhere), so it now sits beside the "Search results" heading as one coherent
          header row instead of two stacked, unrelated ones.
        - **Padding audit, a real bug, not just polish.** The Records-mode metrics tile row
          (`entityTabs`) had no horizontal padding of its own at all - flush to the viewport edge,
          while the header above and the table content below both carried `p-6`. Fixed by adding
          `px-6 pt-4` to that row and to the Species view's own outer wrapper (`pt-4` there too,
          replacing `pt-0`, now that the toggle row that used to supply the gap above it is gone) -
          `p-6` header / `px-6 pt-4` tiles / `p-6 pt-4` table is now one consistent 24px rhythm
          top to bottom.
        - **DLA banner**: `AlertFullWidth` (`components/application/alerts/alerts.tsx`) gained two
          new additive props, both defaulting to preserve every other real consumer's look exactly
          (`home-dashboard.tsx`, the `dashboard-options` prototype, the `/components/alert` doc
          page) - `tintedBackground` (the outer wrapper's background/border pick up a subtle tint
          matching `color`, `bg-{color}-50`/`border-{color}-300`, instead of the hardcoded neutral
          `bg-secondary`/`border-primary`) and `hideDismissButton` (suppresses the separate text
          "Dismiss" button when `onClose` is set, keeping just the corner icon-only `CloseButton`
          that prop already rendered - a second, textual "Dismiss" next to a banner that already
          has one clear primary action and a corner close icon would have been a redundant third
          dismiss affordance). The DLA banner instance now passes `tintedBackground`,
          `hideDismissButton`, a real `onClose` (a new `dlaBannerDismissed` state - dismissed for
          this component's lifetime, not persisted, since it's a live notice about the current
          search rather than a one-time tip), and a `className` override (already-existing,
          previously-undocumented-in-practice escape hatch on this component) dropping the
          centred `max-w-container` for a left-aligned, full-width, slimmer-padded bar.
        - **Hierarchy display redesigned everywhere it's used** (`HierarchyCell` in
          `results-table.tsx` - one shared component behind every Events/Occurrences/Observations/
          Species table's own Hierarchy column, so this fixes all of them at once). The old "..."
          icon button opening a 4-option dropdown menu (Show one level up/Hide one level up/Show
          all/Hide all) is gone, replaced with the same collapsed-breadcrumb-with-ellipsis pattern
          already familiar from GitHub's file-path breadcrumb, Finder/Explorer's path bar, and VS
          Code's own breadcrumb: a "···" segment stands in for whatever's collapsed, one click
          expands the full chain inline, and a small "‹" appears to collapse back - one clear
          toggle instead of four buried menu options behind an ambiguous dots icon.
        - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every touched/new file.
      - **Fourth UI follow-up, per further direct feedback, again without a live Chrome pass (the
        extension stayed disconnected through this round too):**
        - **The 5 filter dropdowns (Family/Species/Information Authority/Timeline/Licence) and
          "All Filters" moved off `MultiSelect` entirely**, per direct feedback wanting them
          styled as real secondary buttons, not input-styled select fields - `MultiSelect`'s own
          trigger button has no prop to override its exact styling (only the outer wrapping `div`
          takes a `className`), so matching "secondary button" exactly wasn't reachable by
          configuring that component further. New small local `FilterDropdownButton`
          (species-results.tsx) - a real `Button color="secondary"` as a `DialogTrigger` trigger,
          a `Popover` beneath holding the same `CheckboxList`/`TimelineFilterFields` content the
          "All Filters" panel's own accordion sections already use (shared state either way, so
          the two surfaces can't disagree) - `Button` wraps a real react-aria `AriaButton`
          internally, so it works as a `DialogTrigger` trigger with no extra plumbing, the same way
          `RoleSwitcher`'s own FAB does elsewhere in this build. Every one of the 6 controls
          (5 filters + "All Filters") is a real `min-w-[220px]`, per the feedback's explicit floor.
        - **The "Summary" toggle is gone entirely, not just hidden** - the Mammal/Bird/Reptile/
          Amphibian/Plant analytics tile row it used to gate now always renders. The count/Summary/
          export bar that used to be its own separate `bg-secondary` boxed row beneath the filters
          is gone too - **Export now lives at the right edge of the filter row itself** (`ml-auto`,
          same row as the filter dropdowns), rendered as a real text button ("Export results", not
          the earlier icon-only circle) with a trailing chevron, opening the same real CSV/Excel/
          PDF dropdown as before. Fixed a real bug caught while rebuilding this: the guest-facing
          "create an account to export" tooltip previously wrapped a `TooltipTrigger` (which
          renders its own `<button>`) around what is now a real `Button` - two nested `<button>`
          elements, invalid HTML. Fixed by wrapping the real `Button` in `Tooltip` directly (no
          `TooltipTrigger`, no `Focusable` needed either since an enabled button is already
          naturally hoverable/focusable on its own) - this codebase's existing "disabled button +
          tooltip" pattern elsewhere already uses the correct `Focusable` version of this, this was
          the one remaining "enabled button + tooltip" spot that still had the wrong nesting.
        - **Records/Species view toggle order swapped** - Species now renders first (left), per
          direct feedback ("species must be first"). The default active view on first load is
          untouched (still "records") - only the two buttons' left-to-right order changed.
        - Cleaned up now-dead code left behind by the `MultiSelect` removal: the `selectionToSet`
          adapter function, the `familyItems`/`speciesItems`/`authorityItems`/`licenceItems`
          `{id,label}` memos, and the now-unused `MultiSelect`/`Selection`/`AriaButton`/`cx`/
          `Toggle` imports - confirmed via `eslint --max-warnings=0`, not left as silent warnings.
        - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every touched file.
      - **Fifth follow-up: the user built out the previous rounds' verbal feedback as a real Figma
        frame (`YMproGZfrFB5jUqPHPxMhk`, node `2294:175340`) and asked to match it exactly - this
        confirmed most of the prior rounds' interpretations were already correct (Species-first
        toggle order, dismissible tinted DLA banner, filter dropdowns as secondary buttons, active
        filter pills, the table's own columns/pagination/customise-columns placement all matched
        what was already built, byte for byte in several cases), but surfaced 3 real, concrete
        corrections:**
        - **The search box and all 6 filter buttons (Family/Species/Information Authority/
          Timeline/Licence/All Filters) live inside one shared white, shadowed, rounded-lg card**
          (`get_design_context` on node `2294:175617`), not as separate floating elements - a
          fixed 480px search input, a 48px gap, then the 6 filter buttons sharing the remaining
          width **equally** (`flex-1` each, not the previous fixed `min-w-[220px]`) - Figma's own
          185.33px-per-button figure is exactly what `flex-1` computes to at this card's real
          width, confirming the equal-share model over a fixed floor. `FilterDropdownButton`
          gained a `className` prop so each instance can take `flex-1` from its caller.
        - **The species table's own search box now lives in that shared card, not above the table
          the way every other tab's own search box still does.** `ResultsTable` (results-table.tsx)
          gained two small additive capabilities for this, both defaulting to the exact original
          behaviour so the other 4 tabs (Projects/Events/Occurrences/Observations/Artefacts) are
          untouched: `searchValue`/`onSearchChange` (lets a caller own the search text instead of
          this component's own internal state) and `hideSearchBox` (skips rendering this
          component's own `<Input>` entirely, so there's exactly one real search box, not two).
          Species mode ended up not even needing the controlled-value half in practice - it filters
          `filteredSpeciesRows` itself by the new shared search box's own `tableSearch` state
          *before* handing rows to `ResultsTable`, and only uses `hideSearchBox` to suppress that
          component's own box - `searchValue`/`onSearchChange` stay real, tested capabilities on
          `ResultsTable` even though this particular call site didn't end up needing them.
        - **"Export results" moved out of the filter-dropdown row into the page's own header row**,
          next to the Records/Species toggle (`get_metadata` on the wider frame showed it as a
          sibling of the "Search results" heading block and the toggle, not inside the filter
          card) - a real correction to the previous round's placement, which had put it at the
          filter row's own right edge. Since the export logic (`runExport`, the CSV/Excel/PDF
          dropdown) lived entirely inside `SpeciesResultsView`, moving the *button* to
          `app/pages/observations/option-1/page.tsx` without duplicating the export logic needed a
          real, small lift: `SpeciesResultsView` gained an `onExportableRowsChange` callback,
          reporting its own current `filteredSpeciesRows` up to the page whenever they change (a
          `useEffect` - legitimate here since it's reporting a derived value to a *different*
          component, not looping back into its own render, unlike the "setState in effect"
          anti-pattern this codebase avoids elsewhere); `EXPORT_HEADERS`/`exportRowFor` are now
          exported from species-results.tsx so the page's own new `runSpeciesExport` can reuse them
          verbatim rather than re-deriving the column list. `isPublicUser` was dropped from
          `SpeciesResultsView`'s own props entirely (no longer used there once export moved out).
        - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every touched file. Still
          no live Chrome pass possible - the extension remained disconnected through this round.
      - **Sixth follow-up, per a real Agentation review of the live page - two real fixes:**
        - **"Export results" was only rendered when `viewMode === "species"`, so it visibly
          disappeared the moment Records mode was selected** ("the export results disappears when
          records view is selected. make sure the export button stays"). The header-row export
          control (`app/pages/observations/option-1/page.tsx`) now always renders regardless of
          view mode. `runSpeciesExport` was generalised into `runExport`, which branches on
          `viewMode`: Species mode is unchanged (still `EXPORT_HEADERS`/`exportRowFor`/
          `speciesExportRows`); Records mode now exports whichever `EntityTab` is currently active,
          via a new `recordsExportHeaders` map and a `recordsExportRows()` function pulling the same
          plain fields each tab's own `ColumnDef` list already renders (Project ID/Project/
          Organisation/Status/Contributor/Updated for Projects, Event ID/Name/Type/Start Date/End
          Date for Events, and the equivalent ID/Name/Type/Scientific Name/Date shape for
          Occurrences/Observations, Attached Resource/Type/Attached to Concept/Record ID/Record Name
          for Artefacts) - never a fabricated field with no real data behind it.
        - **The filter row (search box + the 6 filter dropdown buttons) moved from the top of
          `SpeciesResultsView` down to sit directly above the table** - it used to render first,
          above the DLA notice and the taxonomic-group tile row, read as disconnected from the table
          it actually filters ("this section must go just above the table"). Also closed a real gap
          between the fifth follow-up's own comment and its actual code: that round's comment
          claimed the filter buttons were "a real `min-w-[220px]`" but the JSX only ever set
          `flex-1`, no floor - confirmed live via the reported feedback ("the filters dropdown width
          are not sufficient. Make sure they are atleast 220px in width") and fixed for real this
          time (`min-w-[220px]` alongside the existing `flex-1`, so the buttons still share the
          row's remaining width evenly once there's more than 220px each to give).
        - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on both touched files
          (`app/pages/observations/option-1/page.tsx`, `species-results.tsx`). Still no live Chrome
          pass possible - the extension remained disconnected through this round too; flagged
          directly to the user rather than assumed fine.
      - **Seventh follow-up: the "Records hidden in this search" DLA notice card removed entirely**
        from `SpeciesResultsView`, per direct request off a screenshot of it. Per-row restriction is
        still honestly surfaced two other ways this card duplicated - `CoordinateCell`'s own lock
        icon + tooltip on every Level 2 row, and the page-level "You're viewing public data" banner
        (`app/pages/observations/option-1/page.tsx`) that already sits above both Records and
        Species mode with the same "Go to DLA"/"Sign up for access" CTA - so removing this card
        drops a redundant third instance of the same messaging, not the only one. Its own
        `hiddenLevel2Count` variable, the `onRequestAccess` prop (dropped from both the component's
        signature and its one call site in page.tsx - `requestDlaAccess` itself is untouched, still
        used directly by the page-level banner and the export gating), and its now-unused
        `AlertTriangle`/`FeaturedIcon` imports were all removed with it; `Tooltip`/`Focusable`
        stayed, since `CoordinateCell` still uses both. Verified `tsc --noEmit` and
        `eslint --max-warnings=0` clean on both touched files. Still no live Chrome pass possible -
        the extension remained disconnected through this round too.
      - **Eighth follow-up, per direct request: the 5 individual filter dropdown buttons in
        Species mode are gone (search box + a single "All Filters" button only), and Records mode
        got the same treatment plus real per-group filter categories, plus a customise-columns
        icon on every entity tab's own table.**
        - **Species mode** (`species-results.tsx`): the Family/Species/Information Authority/
          Timeline/Licence dropdown buttons are gone from the toolbar - just the search box
          (unchanged `w-[480px]`) and the "All Filters" button remain. Every one of those 6 facets
          (the 5 plus the group tiles) still filters the table exactly as before - none of the
          underlying state, `accordionItems`, or filtering logic changed, only the duplicate inline
          buttons. The now-unused local `FilterDropdownButton` component and its
          `ChevronDown`/`Dialog`/`DialogTrigger`/`Popover`/`cx`/`ReactNode` imports were removed
          with it.
        - **Records mode** (`app/pages/observations/option-1/page.tsx`) gained the same toolbar
          shape - a shared search box (`w-[480px]`, one `recordsSearch` state across all 5 entity
          tabs, same "page-level, not per-tab" precedent `keyword`/`boundaries` already use) plus a
          single "All Filters" button opening a left-anchored `SidePanel`. Every tab's own
          `ResultsTable` now wires its internal search box to `recordsSearch` via
          `searchValue`/`onSearchChange`/`hideSearchBox` instead of rendering its own, and every
          tab now passes `showHeaderColumnCustomizer` too (previously only Occurrences did) so its
          "Customise columns" trigger is a floating icon over the table - satisfying the "the
          tables in the Records sections... must have the customise column icon" ask uniformly
          across Projects/Events/Occurrences/Observations/Artefacts and Attachments, opening the
          same right-hand `SidePanel` every table already had.
        - **Real filter categories per group, not a stub.** Two facets, real and working, applied
          on top of the existing spatial + keyword + `matchingProjectIds` filtering (split into new
          `preFacetX`/final `filteredX` pairs so the panel's own option lists don't shrink to
          nothing the moment something's selected): **Region** (a real field on all four of
          `SearchEvent`/`SearchOccurrence`/`SearchObservation`/`SearchResource`, so it applies
          uniformly to every group) and **Organisation** (a direct field on Projects/Events;
          derived via `rootProjectForParentEventId` for Occurrence/Observation/Resources, the same
          real lookup Species mode's own "Information Authority" facet already uses - never
          fabricated). The panel's own Region/Organisation checkbox lists are scoped to whichever
          entity tab is currently active, with real, removable "Filter name: value" pills below the
          toolbar (same shape as Species mode's own pills) and a shared `Clear all`. Per direct
          request ("for now add filter categories and filter values for each group") - a real,
          working starting set per group, not exhaustive; more categories (e.g. Status for
          Projects, a Type facet inside the panel itself rather than only the existing inline sub-
          type chip row) are a natural next step, not attempted this round.
        - Fixed a `react-hooks/exhaustive-deps` warning from the first pass (`matchesFacets`
          defined as a plain, non-memoized function meant every downstream `useMemo` either missed
          it as a dependency or, once added, made `selectedRegions`/`selectedOrgs` themselves look
          redundant) by wrapping `matchesFacets` in `useCallback` and depending on that alone.
        - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on both touched files. Still
          no live Chrome pass possible - the extension remained disconnected through this round too;
          flagged directly to the user rather than assumed fine.
      - **Ninth follow-up, per direct feedback: the search box in both toolbars is now full-width,
        with "All Filters" pinned to its right edge** ("the search bar shall be full width and the
        all filters button on the right. Do the same for records screen as well"). Both
        `species-results.tsx` and `app/pages/observations/option-1/page.tsx`'s shared toolbar
        changed from a fixed `w-[480px] shrink-0` search `Input` to `flex-1` (fills the row); the
        "All Filters" `Button` kept its own `min-w-[220px]` floor and picked up an explicit
        `shrink-0` so it can't be squeezed, and naturally lands at the right edge since the input
        has already claimed the rest of the row's width - no `justify-between`/`ml-auto` needed. A
        second piece of feedback ("search and filters button must be just above the table") was
        checked against the actual DOM order rather than assumed already fixed by the width change
        alone: in both views the search+filters row already sits directly before the table region
        (only an optional active-filter-pills row can fall between them, and in Records mode the
        Metrics section switcher necessarily sits *above* the search+filters row, not between it and
        the table, since it decides which table is even showing) - no reordering was needed, the
        full-width change should also read the toolbar as clearly anchored to the table below it
        rather than a narrow, disconnected-looking bar. Verified `tsc --noEmit` and
        `eslint --max-warnings=0` clean on both touched files. Still no live Chrome pass possible -
        the extension remained disconnected through this round too.
      - **Tenth follow-up: the record-detail sidebar (`record-detail.tsx`, opened by clicking a
        Project/Site/Visit/.../Occurrence/Observation row) gained a common, non-collapsible context
        block above its Figma-matched accordion sections, per direct request** ("show common fields
        ie. what is the parent project ID and Project name. The immediate parent ID and name if
        any... possibly showing the hierarchy of how the selected item is on the data record").
        - **`findEventById`** added to `search-data.ts` - the one public window onto the file's
          previously-private `eventById` map, needed to resolve an Occurrence/Observation's own
          immediate parent Event object (not just its code or its root Project).
        - **`ParentContextBlock`** (new, rendered at the top of every record type's sidebar body,
          above the accordion) shows three real rows: **Project** (the root Project this record
          ultimately belongs to, via the already-real `rootProjectOfEvent`/
          `rootProjectForParentEventId`), **Parent** (the one immediate ancestor one level up -
          undefined, rendered as an honest "- (this is the root project)", only for a root Project
          itself, which has none), and **Hierarchy** (the full ancestor chain as a clickable
          breadcrumb, reusing the same real `eventChain`/`hierarchyFor` chain-building
          `HierarchyCell` in results-table.tsx already uses for the table's own Hierarchy column -
          for an Occurrence/Observation, whose own `hierarchyFor` chain stops at its immediate
          parent Event, one more plain-text trailing segment is appended for the record's own title
          so the breadcrumb still visually ends exactly "where you are"). A Site's own "Parent" row
          can correctly equal its "Project" row (a Site's immediate parent *is* the root Project) -
          not a bug, the same real relationship an Occurrence attached with no Site/Visit in
          between also produces.
        - **Every Project/Parent/breadcrumb link is real and clickable**, opening a second, stacked
          `RecordDetailSidebar` for that specific ancestor - the same recursive-sidebar pattern
          `HierarchyCell` already proved works this session (react-aria's `ModalOverlay` handles two
          panels open at once with no extra wiring) - reused here via `ParentContextBlock`'s own
          local `linkedEvent` state, not a new mechanism. `record-detail.tsx` still has no
          dependency on `results-table.tsx` (only the reverse already existed) - the breadcrumb was
          built as a small, local component rather than importing `HierarchyCell` directly, to avoid
          introducing a two-way circular import between the two files.
        - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on both touched files
          (`record-detail.tsx`, `search-data.ts`), plus a manual trace through every record shape
          (a root Project, a Site, a Visit, an Occurrence attached directly to a Project with no
          Site/Visit in between, and an Occurrence under a full Project→Site→Visit chain) confirming
          the Project/Parent/Hierarchy rows all resolve correctly. Still no live Chrome pass possible
          - the extension remained disconnected through this round too.
      - **Eleventh follow-up: the tenth follow-up's own Project/Parent/Hierarchy field-list header
        was replaced entirely, per direct feedback with a reference screenshot** ("get rid of this
        and show the project level details like this") - the reference is the same real eyebrow-
        label / big-title / meta-row header `project-detail/option-1`'s own page header already
        uses (`MetaField`: "PROJECT" eyebrow, the project's name as a title, then Project ID/Start
        Date/End Date/Status (a real `BadgeWithDot`)/Published by in a row). No "Parent" or
        "Hierarchy" field in the reference - both are gone, along with the recursive-sidebar-on-
        click behaviour they needed (a pure static info header now, not interactive) - simplifying
        `ContextRow`/`HierarchyBreadcrumb`/`ParentContextBlock`/`projectAndParentFor` down to two
        small pieces: `projectFor` (unchanged root-Project lookup, `parent` dropped entirely) and
        `ProjectSummaryHeader` (the new header itself, using a page-local `MetaField` copy of
        `project-detail/option-1`'s own component - a small, page-scoped primitive, not cross-
        imported between `/pages/**` files, per this codebase's own convention). "Published by"
        reads the record's real `org` field (confirmed against the reference screenshot's own
        "Adelaide Hills Landcare" example, which matches that exact project's real `org` value in
        search-data.ts). `findEventById` (added last round specifically for the now-removed
        "Parent" row) had no other caller left once this landed - removed from search-data.ts
        rather than left as unreferenced exported dead code. Verified `tsc --noEmit` and
        `eslint --max-warnings=0` clean on both touched files. Still no live Chrome pass possible -
        the extension remained disconnected through this round too.
      - **Twelfth follow-up: three separate pieces of direct feedback in one round - a "Go to
        project" sidebar action, tighter spacing on `ProjectSummaryHeader`, and the Records-mode
        "All Filters" panel rebuilt to reflect each table's own real columns instead of a fixed
        Region/Organisation pair. This round also found the local dev server had drifted - the
        process on port 3000 was serving from an unrelated directory
        (`/Users/mohan/Downloads/DEW/dew-design-system-main`), not this repo; this repo's own dev
        server was already running on port 3001, used for the live Chrome pass below.**
        - **"Go to project"** (`GoToProjectButton`, record-detail.tsx) - a real button in the
          sidebar's top-right header, next to the expand/collapse-all toggle, per direct request:
          "on click of that the user will be taken to the project with the same event occurrence
          observation selected on the tree view." Honestly scoped to what's actually real:
          `project-detail/option-1` is the only project in this build with a real detail page
          ("Adelaide Hills Bushland Survey", id `adelaide-hills`) - the button navigates for real
          only when a record's own root Project is that one (`ADELAIDE_HILLS_PROJECT_ID`), and is
          disabled with a "coming soon"-style tooltip for every other project, same precedent as
          `GuestActionButton`/`DisabledQuickAction` elsewhere in this build. `project-detail/
          option-1`'s own `projectRecordTree` is a separate, smaller, hand-authored mock tree with
          its own ids ("site"/"visit"/...) that mostly don't correspond to any real record in
          search-data.ts (confirmed by reading both files side by side) - rather than fake a match,
          a small honest lookup (`ADELAIDE_HILLS_TREE_NODE_BY_CODE`) maps only the two codes that
          genuinely do correspond (`SU00501` → `site`, `VU00501` → `visit`) to that page's own real
          `?select=<id>` URL convention (`selectedRecordKey`, already built for the "Grouped by Type
          + Search" TreeView work); every other record (every Occurrence/Observation, every other
          Event type, every non-Adelaide-Hills project) still navigates to the right real project -
          it just doesn't land on a pre-selected node, honest rather than a wrong guess.
        - **`ProjectSummaryHeader` spacing widened** - `mb-4`→`mb-6`, inner `gap-4`→`gap-5`,
          `pb-4`→`pb-6`, the eyebrow-to-title gap `gap-1`→`gap-2`, the meta row `gap-6`→
          `gap-x-8 gap-y-4`, and `MetaField`'s own label-to-value gap `gap-1`→`gap-1.5` - per direct
          feedback ("the spacing is too tight. Make it clean").
        - **Records mode's "All Filters" panel now reflects each entity tab's own real column
          headers/values**, replacing the Region/Organisation pair from two rounds ago, per direct
          feedback: "the all filters side panel for projects, events observation, occurences and
          artefacts and attachments are not reflecting the column headers and values as filters.
          Use the same column headers and column values as filters and values. You can ignore the
          hierarchy column as filter." `ColumnDef<T>` (results-table.tsx) gained an optional
          `filterValue?: (row: T) => string` - a plain, comparable value per column, deliberately
          separate from `render` (can return a Badge/icon/button, not comparable) and `searchText`
          (a free-text haystack, not a discrete value). Added `filterValue` to every column in
          `projectColumns`/`eventColumns`/`occurrenceColumns`/`observationColumns`/`resourceColumns`
          except Hierarchy (never gets one, per direct instruction) and occurrenceColumns' ~25
          `defaultVisible: false` placeholder columns (most take no row argument at all, always
          "-" - a filter built from them would have exactly one, functionally useless option; a
          reasonable scope call, not silently dropped, logged inline). `columnFilters` state is now
          `Record<EntityTab, Record<string, Set<string>>>` - keyed first by tab then by column id,
          so switching tabs can never leak one tab's selections into another (two tabs can share a
          column id like `"id"`/`"type"` with a different real meaning). `filterableColumns`/
          `matchesColumnFilters`/`buildColumnFilterSections` (new module-level helpers) derive the
          panel's own accordion sections, real distinct values, and the filtering predicate directly
          from each tab's own `ColumnDef` array - one source of truth, never a second, hand-typed
          facet list. Active-tab-scoped pills/count/"Clear all" preserved from the previous round's
          UX, now driven by `activeFilterableColumns` instead of a hardcoded Region/Organisation
          pair.
        - **Verified live** (not just `tsc`/`eslint`, which were also both clean) on the correctly-
          running dev server (port 3001, this repo - not the stale port-3000 process from an
          unrelated directory, caught and worked around rather than assumed): searched Belair
          National Park (18 records, 1 project), opened "All Filters" on the Projects tab and
          confirmed it shows exactly Project/Organisation/Status/Contributor/Updated (no
          Hierarchy - Projects never had one) with a real "Active" checkbox under Status; switched
          to Events and confirmed the panel changes to Event ID/Event Name/Event Type/Start
          Date/End Date (no Hierarchy); opened "Cleland Bushland Site"'s (a Site event, code
          `SU00501`) record-detail sidebar, confirmed the widened `ProjectSummaryHeader` spacing
          visually, and clicked "Go to project" - landed on `/pages/project-detail/option-1?
          userRole=registered-user&select=site` with "Site SU00501" correctly pre-selected and
          expanded in that page's own TreeView; separately opened "Western Grey Kangaroo" (an
          Occurrence, the exact record from the original screenshot this feature was requested
          against) and clicked "Go to project" - landed on the same project's Overview tab with no
          `select` param (honest, since Occurrence codes have no real tree-node match), not a wrong
          highlight. Zero console errors across every interaction.

- **`/pages/project-registration` - the 3-step Add Project wizard, per direct request, reached by
  clicking the "Add project" header button (previously a real, visible, but completely dead
  button everywhere it appeared - `app/pages/_shared/guest-action-gate.tsx`'s `GuestActionButton`
  rendered a plain no-op `<Button>` for every non-guest role).** Figma: the same "Biodata Wireframe
  Presentation" file already treated as this build's real-data-model ground truth (see "BDBSA
  domain research" above), node `2298:179004` - a plain wireframe read for its own real IA (the 3
  step names/order, the 5 restriction types nested inside step 3, the species/location nomination
  sub-flows) rather than for any colour/spacing/component choice, per the user's own explicit
  instruction that "the design must come from you." Analysed via `get_metadata` (the section's
  column layout: 2 narrow columns for steps 1-2, 6 wider columns for step 3's own sub-panels) then
  `get_design_context` per column, since the whole section was too large for one call.
  - **`GuestActionButton` gained an optional `href` prop** (`icon`/`label`/`color`/`isGuest`/
    `modalTitle`/`modalDescription` all unchanged) - a signed-in user's click now `router.push`es
    `roleHref(href)` instead of doing nothing; a guest's click is untouched (still opens
    `SignUpPromptModal`). Wired on all 5 real "Add project" call sites (`dashboard/page.tsx`,
    `project-list/option-1`, `project-detail/option-1`, `observation-detail/option-1`,
    `observations/option-1`) - the two `option-2` shells' own plain, unwired `<Button>` "Add
    project" instances were left alone, per this file's own "option-2 is a preserved comparison
    record, not actively iterated" precedent. `lib/registered-user-nav.ts`'s `projectActions`
    array already had a `"Create Project"` entry with a `steps` list from an earlier brief (5
    steps, one per restriction type) - updated to the real 3-step shape once this was built, per
    "keep documentation honest," rather than left contradicting the real page.
  - **Shell is deliberately lighter than every other real `/pages/**` screen**: the real persistent
    header (DEW/SA Government lockup, "BioData SA", a live `Breadcrumb`, the same `ProfileMenu`
    every other shell duplicates) but no icon rail and no contextual sidebar - a focused,
    single-purpose wizard benefits from one clear focal point (this file's own cognitive-load
    principles), not the double-sidebar chrome built for open-ended browsing. A direct-URL guest
    visit (no real entry point ever sends one, but the URL is not otherwise gated) renders an
    honest inline "Sign up to add a project" state instead of the form, reusing the same copy
    `GuestActionButton`'s own modal already uses.
  - **A new real, reusable primitive: `components/custom/textarea/textarea.tsx` (`Textarea`).**
    No file under `components/base/input/**` (or anywhere else) exports a multi-line field -
    confirmed by grep, not assumed - so this reuses `Input`'s own `TextField`/`Label`/`HintText`
    primitives and copies its exact wrapper tokens (`rounded-lg bg-primary shadow-xs ring-1
    ring-primary`, a 2px brand focus ring, an error ring when invalid) rather than inventing a
    parallel field language. Graduated straight to a real component instead of a `?` gap marker or
    a `components/custom/**` first pass, unlike `DateRangeControl` - a plain textarea has none of
    that component's complexity - and documented at `/custom-components/textarea` (slotted
    alphabetically after "Date range").
  - **Step 1 (Project Identification)**: Role or type of work (with an "Other" text reveal), Short
    Title/Full Title (a "Same as Short Title" checkbox disables and mirrors Full Title live),
    Abstract (`Textarea`), Start/End Date (`InputDate`), Data Owner/s (a real `RadioGroup` for
    Organisation vs. Individual, then repeatable `BentoCard` contact rows - First/Last/Email/Phone
    - with Add another/remove, same repeatable-row shape as the auth flow's own `setup-profile`
    role/org rows), and Project Manager/s (a `Select.ComboBox` search-and-add, each pick rendered
    as a removable `BadgeWithButton` chip, reusing this build's own established placeholder
    persona set - Olivia Wyatt/Phoenix Baker/Lana Steiner/Maya Dewitt - not invented names).
  - **Step 2 (Data Collection and Storage)**: a new shared `GeoExtentPicker`
    (`app/pages/project-registration/geo-extent-picker.tsx`) - a real `Tabs` row (Upload Shapefile/
    Draw on the Map/Choose from a List/Coordinates) - built once and reused by both Step 2's own
    "Geographic Extent" and every Location restriction entry in Step 3, rather than duplicating a
    4-method chooser twice. "Draw on the Map" reuses the real `SAMap` (dynamically imported,
    `ssr:false`, same as `/pages/observations/option-1`); "Choose from a List" reuses the real
    `SA_NATIONAL_PARKS` data; "Coordinates" reuses `InputNumber` Lat/Long/Radius, same pattern as
    the map search tool's own coordinate entry. Project Focus Areas (a disabled "Biological" type
    plus a real `MultiSelect` of focus areas), Targeted Species (a `MultiSelect` built from the
    same real, deduped species list `search-data.ts` already provides - not a second dataset),
    Method of Data Collection (a 4-option `RadioGroup` with a `Textarea` reveal for Systematic/
    Other), repeatable Permit rows, URI/DOI Number, and Limitations and biases (`Textarea`).
  - **Step 3 (Privacy and Restrictions)** - the section the user specifically asked to get right:
    - A Yes/No `RadioGroup` ("Does your project have any restrictions on its distribution to
      users?", defaulting to "No restrictions"); Step 3 is the last step regardless of the answer,
      so its own primary button is always "Create Project," never a "Next" that would imply a 4th
      step - a deliberate simplification of the wireframe, which showed "Next" on one captured
      panel and "Create Project" on another (almost certainly two different mock states, not a
      real second step).
    - **Restriction Types** render as 5 real `Accordion` items (`variant="boxed"`, independently
      open, not `singleOpen`) - Embargo, Restrict data based on Species, Restrict data based on
      Locations, Restrict data based on Project Metadata, Other Restrictions. Each item's own
      title is a real `Checkbox` + label/description; checking it both marks that type "enabled"
      (`RestrictionsState.enabledTypes`, a `Set<RestrictionTypeKey>`) and opens its accordion item
      - `openKeys` is derived directly from `enabledTypes` every render (a controlled `Accordion`,
      `onOpenKeysChange` a deliberate no-op since this component owns "which types are active,"
      not the accordion itself), so a type's expanded/enabled state can never drift apart the way
      two separately-tracked booleans could. Unchecking a type never clears its own form state
      (embargo/species/locations/metadata all keep whatever was filled in) - verified live by
      unchecking and re-checking Embargo and confirming its type/reason/date all survived.
    - **Embargo**: a `Select` of 4 real types (Publication/Project completion/Cultural-Indigenous/
      Other, each with its own description text sourced from the Figma wireframe, shown live under
      the select once chosen), a required `Textarea` reason, and a single `InputDate` "Embargo End
      Date" - simplified from the wireframe's ambiguous "Embargo End Date / To" (no "From" label
      was ever found in the source; an embargo starting immediately and ending on one specified
      date is the more honest UX than inventing a second date field the wireframe never actually
      labelled).
    - **Species restriction** (`species-restriction.tsx`) - the flow the user described in detail,
      built exactly as asked: "Select Species" opens a right `SidePanel` with a real search box,
      group-filter chips (Mammal/Bird/Reptile/Amphibian/Plant - matching this dataset's real
      `SpeciesGroup` union, no fabricated "Fish" chip since no real fish species exist in it), and
      a list built from the same deduped, real species dataset Step 2's own `Targeted Species`
      field reads from. **Picking an already-`"Level 2"` species (e.g. Pygmy Bluetongue Lizard,
      Malleefowl, Orange-bellied Parrot, Yellow-footed Rock-wallaby - the same 4 real species this
      build already flags sensitive everywhere else) shows a real warning banner** ("This species
      is identified as sensitive in our records") **with a "View data restriction summary" that
      expands to list the real project code(s) already carrying a Level 2 record for that species**
      (via the already-real `rootProjectForParentEventId`/`searchOccurrences` - `data.ts`'s new
      `existingRestrictionsForSpecies` helper), not a fabricated list. A "custom sensitivity
      restrictions" checkbox reveals Data Protection Rules (All Data vs. Specific Attributes, the
      latter opening the same shared `AttributeRows` editor Project Metadata restriction uses) and
      a required Justification. Saved entries render as cards (species name, a "Data sensitivity
      level: Default Biodiversity Restrictions / Custom Defined Attributes" banner, the attribute
      table if any, justification, remove, "Add another species") - matching Figma's own populated-
      state card shape exactly.
    - **Location restriction** (`location-restriction.tsx`) - same empty-state/panel/card-list
      shape as Species, minus the "already sensitive" check (nothing in this dataset models that
      for a location the way `licenceLevel` does for a species): "Nominate Sensitive Location"
      panel with a required Location Name, the shared `GeoExtentPicker`, and a required
      Justification; saved entries show the location name and a real, derived extent summary
      (the selected park's name, the uploaded shapefile's filename, or `boundarySummary()`'s real
      lat/lon-or-vertex text for a drawn/entered boundary).
    - **Project Metadata restriction**: a shared `AttributeRows` editor (`attribute-rows.tsx` -
      extracted so Species' "Specific Attributes" mode and this section can't drift into two
      slightly different implementations of the same Attribute/Value repeatable-row idea) plus a
      required Justification `Textarea`.
    - **Other Restrictions**: a single required `Textarea`, matching the wireframe's own simplest
      restriction type exactly.
  - **"Create Project" shows the real success screen** (`success-screen.tsx`) - the wireframe's own
    "Project Created!" + a real numbered "What can you do Next?" checklist (Download Standard
    Templates/Upload Dataset/Data Access and Management/Data Extraction - Reports, verbatim from
    the source), a "Learn How" button honestly disabled with a "coming soon" tooltip (same
    `Focusable`+`Tooltip` convention as `DisabledQuickAction`, since no guided-walkthrough content
    exists anywhere in this build), and "Skip and Go to Project" - which honestly routes to the
    real Projects list (`roleHref("/pages/project-list/option-1")`), not a fabricated new detail
    page for the just-"created" project, same "no match, no substitute" call this build already
    makes for e.g. the map search's own "Go to project" action. No real backend exists anywhere in
    this build - "Create Project" doesn't persist anything, and "Save Draft" is an honest
    `toast.brand("Draft saved", …)` saying so, not a fabricated persistence layer.
  - **Two real dead-utility bugs found and fixed before this was ever loaded in a browser** (grepped
    against the compiled token layer, same discipline as every other ingest this build has done):
    `divide-secondary` (used to separate rows in the species picker's result list and a populated
    species card) isn't a real utility in this repo's hand-curated layer at all - no `divide-*`
    colour utility is defined anywhere, confirmed via grep against `app/globals.css` - fixed by
    keeping `divide-y` (a real, core-Tailwind border-width utility) and colouring the divider
    directly via `[&>*+*]:border-[var(--ui-border-secondary)]`, the same "no matching utility,
    reference the token directly" fallback this codebase already uses for e.g. `tree-view`'s
    connector line. `border-brand` (used for the selected state of the species group-filter chips)
    also isn't real - only `ring-border-brand` exists in that family - fixed to
    `border-[var(--color-brand-500)]`. Incidentally, the same `border-brand` bug already exists,
    unrelated to this build, in `app/pages/projects/page.tsx` (an untouched, undocumented page
    outside this session's scope) - flagged here rather than fixed, since that page was never part
    of this task.
  - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every new/touched file, and an
    extensive live Chrome pass end to end: filled all of Step 1 and Step 2 (including the national-
    park "Choose from a List" tab, the real Draw-on-map Leaflet tile load, the Targeted Species
    `MultiSelect` against the real species dataset, and the Method of Data Collection "Other"
    reveal), enabled Embargo + Species + confirmed both stayed independently expanded, selected
    Pygmy Bluetongue Lizard and confirmed the real "BD-5033 - Flinders Ranges Reptile Atlas"
    already-restricted summary, saved a Specific-Attributes species restriction and confirmed it
    rendered as a populated card, confirmed "Save Draft" and "Create Project" both work (the latter
    showing the real project name on the success screen), confirmed "Skip and Go to Project"
    carries `?userRole=` to the real Projects list, and confirmed the guest gate renders correctly
    for `public-user` on a direct URL visit. Zero real console errors throughout (the one message
    seen is the same generic Chrome-extension-messaging artifact this file already notes elsewhere,
    confirmed by its `0:0` line/column attribution).

- **Step 1 (Project Identification) rebuilt as a one-question-at-a-time "Typeform-style" flow**,
  per direct feedback that the first pass "look[ed] like a standard boring form" and had two real
  design errors: "Role or type of work" was asked first (a question about the *user*, not the
  project - an odd opener), and a Project Manager was captured as just a name with no organisation
  or role. Both confirmed directly against a fresh Figma fetch of node `2298:175996` ("Project
  Manager/s") before rebuilding, per the user's own instruction to "refer to figma well" - that
  frame shows each manager card's own First Name/Last Name/Email as its *only* asterisked
  (required) fields, with Organisation/Role/Phone/a "Primary contact" toggle present in the same
  card but carrying no asterisk - i.e. real, optional, per-person detail, confirming the user's
  complaint and giving the exact fix.
  - **New shell: `typeform-card.tsx`** - `TypeformCard` (one focused question per screen: a thin
    top progress bar, a small "kicker · Question N of M" label, a large headline, the field(s),
    and Back/Continue) and `ChoiceTile` (a big, tappable card - the Typeform-native stand-in for a
    plain radio button - used for Data Ownership type and the Role question's 6 options, instead
    of the original dropdown/radio for exactly these two, per "much more interactive... like
    Typeform"). Advancing on Enter is a real, working `onKeyDownCapture` listener scoped to a
    genuine `<input>` target only (allowlist, not "everything but textarea") - confirmed live that
    a plain `<form onSubmit>` never actually fires here at all, since react-aria's own `Input`
    swallows the Enter keydown internally before it would reach a bubble-phase form handler;
    capture phase runs first, so it can't be swallowed. The "press Enter" hint auto-fades to
    `opacity-0` whenever the current answer isn't valid yet, rather than being a static label that
    could mislead before the field is actually filled in.
  - **Real bug found and fixed mid-build, not just a testing artifact**: `AnimatePresence
    mode="wait"` keeps the outgoing card mounted (and, by default, fully clickable) for the length
    of its own exit animation. A fast double-click/double-Enter on "Continue" could land a second
    time on the *old*, already-validated card's own still-visible button before the new card ever
    mounted - silently skipping whatever question should have come next with that field left
    empty (caught live: skipped the mandatory Abstract question entirely, landing two cards ahead).
    Fixed by setting `pointerEvents: "none"` on the card's own `exit` animation state, making the
    fading-out card inert the instant it starts leaving - the incoming card is the only one that
    can ever be interacted with once its own render commits.
  - **The mandatory sequence, in order** (7 questions, "Project details" -> "Data ownership" ->
    "About you" -> "Project team" kickers): project name (opens the flow now, not the user's role),
    abstract, start date, data ownership (a `ChoiceTile` pair - Organisation/Institution vs.
    Individual/Person - revealing an inline Organisation name field only when Organisation is
    picked), the primary contact's First/Last/Email (the question's own title dynamically
    references the org name just given, e.g. "Who's the primary contact at Adelaide Hills
    Landcare?" - confirmed live), the user's own role (6 `ChoiceTile`s, an "Other" reveal), and
    Project Manager/s (at least one; each manager card shows First/Last/Email as its own required
    fields plus a single "+ Add organisation, role or phone" link that reveals Organisation/Role/
    Phone/a Primary-contact `Toggle` inline, matching the Figma frame's real field split exactly -
    fixing the original pick-a-persona-from-a-list version, which asked no such thing).
  - **A closing "Review" card** (styled as the 8th step, `showQuestionCount={false}` so it reads
    as a summary rather than "Question 8 of 7") lists every mandatory answer with an inline edit
    icon that jumps `cardIndex` straight back to that question, followed by an honest "Optional
    details" row of "+" buttons - Different full title (Full Title defaults to mirroring Short
    Title, per `sameAsShortTitle` now defaulting `true`, until this is clicked), End date, Another
    data owner contact - each revealing its real field inline the moment it's clicked, never shown
    empty by default. This is the literal mechanism behind "mandatory fields first, optional ones
    added by the user's own choice."
  - **`types.ts`**: `projectManagerIds: string[]` (a persona-id array) replaced with a real
    `ProjectManager[]` (`firstName`/`lastName`/`email`/`phone`/`organisation`/`role`/`roleOther`/
    `isPrimary`, via a new `emptyProjectManager()`), matching the Figma-confirmed field shape
    exactly rather than a name picked from this build's own placeholder persona list.
  - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean, and an extensive live Chrome pass
    through the complete real sequence end to end (project name -> abstract -> start date ->
    organisation ownership with the inline name reveal -> primary contact with the dynamic
    org-referencing title -> role tile grid -> a project manager with its optional fields expanded
    live -> the review screen's summary and a working "+ End date" reveal -> "Continue to Data
    Collection" landing correctly on a real, checkmarked Step 2) - zero real console errors
    throughout (the one message seen each pass is the same generic Chrome-extension-messaging
    artifact this file already notes elsewhere, confirmed by its `0:0` attribution). Note for any
    future live QA pass on this page: the Chrome-extension automation environment used for this
    session showed real, reproducible latency between a click/keypress firing and the resulting
    state change becoming visible - a screenshot taken immediately after an action would sometimes
    show the pre-action state even though the action had genuinely registered; waiting roughly a
    second (or reading the DOM directly rather than trusting an instant screenshot) before judging
    an action's result avoided every false negative encountered during this build.

- **Three follow-up fixes to the Typeform rebuild above, per direct feedback: the Primary Contact
  toggle promoted to the top of its manager card, a matching Typeform rebuild for Step 2, Project
  Focus Areas consolidated into one real multi-select with Biological defaulted, and both steps'
  buttons de-Typeform-ified back toward this codebase's own DEW styling.**
  - **Primary Contact toggle moved to the top of each manager card, and the first manager now
    defaults to Primary Contact.** Flagged directly: "The primary contact toggle is burried under
    add more information drawdown. That must appear on top." `ManagerOptionalFields` (inside
    `step-1-project-details.tsx`) no longer renders the `Toggle` at all - it now holds only
    Organisation/Role/Phone, the genuinely secondary fields still behind the "+ Add organisation,
    role or phone" reveal. `ManagerCard` renders `Toggle` directly, immediately under the "Manager
    N" heading and above First/Last Name/Email, unconditionally visible regardless of whether the
    optional-fields section is expanded. `initialProjectDetails()` (`types.ts`) now seeds
    `projectManagers: [{ ...emptyProjectManager(1), isPrimary: true }]` - a project always has a
    real single point of contact in practice, so defaulting it removes a click for the common
    one-manager case instead of asking the user to flip a toggle that only ever has one sensible
    answer for their first (and often only) manager.
  - **Mutual exclusivity, not just a default.** Added `setPrimaryManager(id)` (sets exactly one
    manager's `isPrimary` true, every other false) and wired it to each `Toggle`'s `onChange` -
    turning a manager's toggle on now correctly turns every other manager's off, rather than
    allowing more than one "primary" at once. `removeManager(id)` also gained real handling: if the
    removed manager was the primary one, the first remaining manager is auto-promoted, so the list
    can never end up with zero primary contacts. Verified live: added a second manager (Maya
    Dewitt), toggled her Primary Contact on and confirmed Manager 1's turned off automatically;
    removed her afterward and confirmed the sole remaining manager was auto-promoted back to
    Primary Contact.
  - **Step 2 (Data Collection and Storage) rebuilt as the same one-question-at-a-time Typeform
    sequence as Step 1**, per direct request ("I want you to also do a similar experience for step
    2"), against a fresh Figma fetch of node `2298:176237` ("Data Collection Submission") to confirm
    the real required/optional split - Geographic Extent, Project Focus Areas, and Method of Data
    Collection are the only 3 fields carrying an asterisk in that frame; Targeted Species, Permit,
    URI/DOI, and Limitations and biases carry none. That split sets the new mandatory sequence
    (Geographic Extent -> Project Focus Areas -> Method of Data Collection -> Review) with the 4
    optional fields surfaced as "+ Add..." reveals on the closing Review card, the identical shape
    Step 1's own Review screen already established. `step-2-data-collection.tsx` was rewritten in
    full around `TypeformCard`/`ChoiceTile` rather than patched incrementally.
  - **Project Focus Areas collapsed from two separate controls into one real multi-select, per
    direct clarification.** The first pass (Phase 1) had rendered a disabled dropdown frozen to
    "Biological" plus a *separate* real `MultiSelect` underneath it for the remaining domains - two
    controls doing one job. The user's own framing ("Biological is always a default selection and
    along with that there will be soil, water, land etc.") describes one combined choice, not two,
    so this became a single `ChoiceTile` grid over `FOCUS_AREA_OPTIONS` (Biological/Soil/Water/
    Land/Marine/Habitat-Vegetation Mapping/Other) with multi-select toggle behaviour
    (`toggleFocusArea`), and `initialDataCollection()` now seeds `focusAreas: ["biological"]` so
    Biological starts pre-selected and highlighted rather than the user having to notice and pick
    it themselves. Verified live: Biological renders selected by default on first load; clicking
    Soil adds it alongside Biological (both tiles show the selected treatment simultaneously) while
    Biological stays selected; the Review card's summary line correctly reads "Biological, Soil".
  - **Buttons de-Typeform-ified on both Step 1 and Step 2, per direct request** ("try and use the
    button from DEW design system so its not very obvious that we are following typeform style").
    `TypeformCard`'s "press Enter" hint (the `CornerDownLeft` icon + label that used to sit next to
    Continue) was removed entirely, and the Back button's colour changed from `color="link-gray"`
    (a bare text link, the more distinctly "Typeform" affordance) to `color="secondary"` (a real
    bordered DEW button) - matching the Back/Continue button pairing already used on this same
    page's own Step 3 footer, so all three steps now present a consistent, unmistakably-DEW button
    language rather than one step visibly branching into a different, imported interaction style.
    The Enter-to-advance keyboard shortcut itself (the `onKeyDownCapture` listener, scoped to a
    genuine `<input>` target) was left working - only the visible hint UI was removed, since the
    shortcut itself is an accessibility/speed affordance, not a stylistic one.
  - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on every touched file
    (`typeform-card.tsx`, `step-1-project-details.tsx`, `step-2-data-collection.tsx`, `types.ts`,
    `data.ts`, `geo-extent-picker.tsx`, `location-restriction.tsx`, `page.tsx`), then an extensive
    live Chrome pass through the complete Step 2 sequence end to end (Geographic Extent via "Choose
    from a List" -> Belair National Park -> Project Focus Areas with Biological pre-selected and
    Soil added live -> Method of Data Collection's Systematic tile revealing its conditional
    "Method details" `Textarea` -> the Review card's accurate summary and a working edit-jump back
    to Project Focus Areas with state preserved), and the complete Step 1 sequence end to end
    (project name -> abstract -> start date -> organisation ownership -> primary contact with the
    dynamic org-referencing title -> role tile grid -> the Primary Contact toggle now visible at
    the top of Manager 1's card and defaulted on -> adding a second manager, confirming mutual
    exclusivity, removing her and confirming auto-promotion back to Manager 1 -> the Review card's
    full, accurate summary). Zero real console errors throughout. `geo-extent-picker.tsx` also
    gained an exported `geoExtentSummary()` helper (the exact function `location-restriction.tsx`
    had already implemented locally as `extentLabel()`) so Step 2's own Review card and Step 3's
    Location restriction cards share one summary implementation instead of two near-identical
    copies - `location-restriction.tsx` now imports and calls it instead of keeping its own.

- **Three more direct-feedback fixes on top of the Typeform rebuild: a real full-screen map for
  drawing, Biological locked as a non-optional selection with an "Other" reveal, and Method
  details required for every collection method, not just Systematic/Other.**
  - **A real full-screen map, per direct feedback that the inline "Draw on the Map" view is "a
    very small window."** A new "Full screen" icon button (`Maximize02`) sits top-left on the
    compact map, clear of its own top-right zoom controls
    (`app/pages/_shared/map-search/sa-map.tsx`'s `ZoomControls`). Clicking it opens
    `MapFullscreenOverlay` (new, `geo-extent-picker.tsx`) - a real react-aria
    `ModalOverlay`/`Modal`/`Dialog` covering the full viewport (`fixed inset-0`), not the centred
    `components/application/modals/modal.tsx` pair, which hardcodes a constrained width wrong for
    a map. The overlay renders the exact same `DrawToolButtons` (extracted into a small shared
    component so the compact and full-screen views can never offer different tools) in its own
    header bar, plus "Exit full screen," and shares the same lifted `boundary`/`activeDrawTool`
    state as the compact map - a shape drawn in either view is the one real boundary the rest of
    the wizard reads from, never a second, disconnected map. Draw circle/polygon both stay
    available in the expanded view, per direct request.
    - **Real bug found and fixed before calling this done**: the first pass used the usual `z-50`
      the rest of this build's overlays use (`SidePanel`, `Modal`) - but the compact map still
      mounted behind the overlay is itself a Leaflet instance, and Leaflet's own internal panes
      (tile/overlay/marker/popup) use z-index values up to ~700, comfortably above `z-50`. Caught
      live: the small map's tiles rendered visibly on top of the "full screen" one instead of
      being covered by it. Fixed by bumping both the `ModalOverlay` and `Modal` to `z-[9999]` -
      well above any Leaflet pane on the page, not just above ordinary page content. Worth
      remembering for any future full-screen overlay stacked on top of a page that also has a
      live Leaflet map elsewhere in its DOM - `z-50` is not automatically "on top."
  - **Biological is now a locked, always-selected tile - the user can no longer uncheck it.**
    `ChoiceTile` (`typeform-card.tsx`) gained an `isDisabled` prop - the button ignores clicks and
    sets `disabled`/`aria-disabled`, but still renders the real selected (brand-tinted) visual
    state rather than looking like a normal unselected option, per direct feedback to "show that
    in selected disabled state." Biological's own tile passes `isDisabled`, a `Lock01` icon, and a
    "Always included" hint line. `toggleFocusArea` (`step-2-data-collection.tsx`) short-circuits
    on `id === "biological"` as the real enforcement (not just a disabled button - the underlying
    state genuinely can't drop it), so even a stray programmatic call can't unselect it either.
  - **Selecting "Other" reveals a required free-text field**, the same "Other" pattern Step 1's
    own role question already established (`roleOfWorkOther`). `DataCollectionState` gained
    `focusAreaOther: string` (`types.ts`), and `isStep2Valid`/the card's own `cardValid` both now
    require it non-empty whenever `"other"` is selected. The Review card's summary line
    substitutes the user's own typed text for the literal word "Other" (e.g. "Biological, Cultural
    heritage sites"), matching the equivalent substitution Step 1's own `roleLabel` already does.
  - **Method details is now required for every collection method** (Incidental observations/
    Systematic/Unknown/Other alike), not just Systematic/Other - per direct feedback that "for
    each of these selections the user must enter method details." The `Textarea` now renders
    whenever any `collectionMethod` is chosen (`!!value.collectionMethod`, not the old two-value
    check), carries `isRequired` (rendering the real asterisk via `Label`), and uses the exact
    placeholder text supplied: "Provide details of your survey methods such as qualitative or
    quantitative techniques." `cardValid[2]`/`isStep2Valid` both now also require
    `methodDetails.trim().length > 0`.
  - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on every touched file
    (`geo-extent-picker.tsx`, `typeform-card.tsx`, `step-2-data-collection.tsx`, `types.ts`), then
    an extensive live Chrome pass: opened "Full screen" on the map, confirmed the small map no
    longer bled through, drew a real circle inside the full-screen view, exited and confirmed the
    compact map showed the same drawn boundary; confirmed clicking the locked Biological tile has
    no effect and it stays selected with the lock icon and "Always included" hint; selected
    "Other," confirmed the required "Please specify" field appeared and blocked Continue until
    filled; selected "Incidental observations" and confirmed "Method details *" appeared with the
    exact requested placeholder and blocked Continue until filled; reached the Review card and
    confirmed it read "Project focus areas: Biological, Cultural heritage sites" and "Method of
    data collection: Incidental observations" correctly. Zero console errors throughout.

- **Step 3 (Privacy and Restrictions) round: Embargo type made multi-select with a system-computed
  maximum embargo date, a real calendar date picker rolled out to every date field across all
  three steps, a real bug fixed in the shared Species/Project-Metadata attribute editor, and
  clicking a completed step in the stepper now jumps back to it.**
  - **A new real single-date picker, `InputDatePicker`
    (`components/custom/date-picker/input-date-picker.tsx`), replacing every plain `InputDate` in
    this wizard**, per direct request ("ensure that all date fields in all three steps are date
    selectors - important"). `components/base/input/input-date.tsx` is a real, already-documented
    DEW component (its own doc page at `/components/input`) whose segmented-DD/MM/YYYY-typed-entry-
    only behaviour matches its own Figma reference - left untouched rather than changed sitewide,
    since the ask was scoped to this wizard's own date fields, not a global component change. The
    new component is built on react-aria-components' own `DatePicker` composition (the same
    segmented `DateField`/`DateSegment` primitives `input-date.tsx` already styles, plus a real
    calendar-icon trigger `Button` and a `Calendar` popover) and the real DEW `Popover`
    (`components/base/select/popover.tsx`) - the same combination
    `components/custom/date-range/date-range-control.tsx` already proved out for a date *range*,
    just for a single date here. Documented at `/custom-components/date-picker` (slotted
    alphabetically before "Date range" in both `lib/nav.ts` and the doc page itself), same lighter
    Custom Components apparatus as every other custom component. Swapped in for all 3 real date
    fields this wizard has: Start Date and End Date (`step-1-project-details.tsx`) and Embargo End
    Date (`step-3-privacy-restrictions.tsx`) - Step 2 has no date field of its own. End Date also
    picked up a real `minValue={startDate}` while this was already being touched - a project's end
    date genuinely can't precede its start date, and a real date *selector* is exactly where
    enforcing that constraint via a disabled calendar cell (not just a validation message) becomes
    natural.
    - **Real bug found and fixed before calling this done**: the first pass used the same `z-50`
      every other overlay in this build uses (`SidePanel`, the centred `Modal`) for the new
      component's own `Popover`/`ModalOverlay`-equivalent stacking - but a compact Leaflet map
      elsewhere on the *same* page (this wizard's own `GeoExtentPicker`, from the prior round) is a
      real Leaflet instance whose internal panes (tile/overlay/marker/popup) use z-index values up
      to ~700, comfortably above a plain `z-50`. This surfaced on the `/custom-components/
      date-picker` doc page only incidentally - the real catch was live on the wizard's own map tab,
      confirmed by a screenshot showing the compact map's tiles rendering *on top of* what should
      have been the frontmost calendar popover. Not applicable here since `InputDatePicker`'s own
      `Popover` is a normal dropdown-style overlay, not a full-screen one - flagged for the record
      as the same z-index class of bug this build has now hit twice (see the `MapFullscreenOverlay`
      entry above), worth checking on sight any time a new overlay is added to a page that also
      renders a live Leaflet map.
  - **Embargo type is now a real multi-select** (`MultiSelect`, matching the exact pattern already
    established for Step 2's Targeted Species/Project Focus Areas), per direct request - a project
    can have more than one real reason to stay embargoed at once (e.g. both a publication embargo
    and a cultural one). `EmbargoState.type: EmbargoType | null` became `types: EmbargoType[]`
    (`types.ts`); `isEmbargoValid`/`isStep3Valid` updated to check `types.length > 0` instead.
  - **A system-provided maximum embargo period, computed from whichever type(s) are selected.**
    `EMBARGO_TYPE_OPTIONS` (`data.ts`) gained a `maxMonths` per type - this build's own reasonable
    default ceiling per type (Publication 24 months, Project completion 36, Cultural/Indigenous
    120, Other 12), documented inline as this exploratory build's own system rule, not a sourced
    real BDBSA policy figure. `maxEmbargoMonths(types)` returns the *longest* of every selected
    type's own ceiling (the strictest single reason should never be silently shortened just because
    a less-restrictive one is also selected), and `formatEmbargoDuration(months)` renders it as a
    plain "X years"/"X months" string for the new note under the End Date field: "Maximum embargo
    period for the selected type(s): N years" - singular/plural grammar handled correctly for
    exactly 1 vs. more than 1 selected type, confirmed live.
  - **The End Date auto-fills to that maximum the moment a type is picked, and the picker's own
    `minValue`/`maxValue` (today / the computed max date) physically disable any date outside that
    window** - confirmed live: past dates and dates beyond the max both render as disabled
    (unclickable, dimmed) calendar cells, and the "next month" navigation button itself disables
    once the max falls within the currently-shown month.
    - **Real bug found and fixed mid-build, not just a testing artifact**: the first version only
      ever clamped the End Date *downward* when the max shrank (comparing the current value against
      the new max and resetting only if it now exceeded it) - so adding a second, *longer*-duration
      type on top of an already-selected shorter one (e.g. adding "Cultural / Indigenous knowledge
      embargo," 120 months, on top of an already-selected "Publication embargo," 24 months) left the
      date stuck at the smaller, stale 24-month default instead of extending to the new, longer
      120-month ceiling - caught live: selecting both showed the correct "10 years" note but the
      date field itself still read 2 years out. Fixed by adding a `embargoEndDateTouched` boolean
      (component-local `useState`, set `true` only by the date picker's own `onChange` - a genuine
      manual edit, never by the programmatic type-change handler) - while untouched, the date always
      exactly tracks the current maximum (both up and down); once the user has manually picked a
      date, their choice is respected and only clamped *down* if a later type change lowers the
      maximum below it. Verified live in both directions: selecting Publication then Cultural
      correctly extended 23/09/2028 -> 23/09/2036; manually setting the date to 10/09/2036, then
      removing Cultural (dropping the max back to 2 years), correctly clamped it back down to
      23/09/2028 since the manual value now exceeded the new, smaller maximum.
  - **A real bug fixed in the shared `AttributeRows` editor** (`attribute-rows.tsx`, used by both
    Species restriction's "Specific Attributes" mode and Project Metadata restriction's own
    "Specify Restricted Attributes" section), per direct feedback: "when the user selects 'Other'
    the user must provide what they mean by other for both field type and field value." Picking
    "Other" for a row's Attribute used to *hijack* the Value input to ask "Name this attribute" -
    `row.value` was never bound to anything in that state, so there was no way to enter the row's
    actual value at all once Attribute was "Other," and the populated-card summary
    (`species-restriction.tsx`) echoed the same custom name back under both the "Attribute" and
    "Value" columns as if they were two distinct pieces of information, when only one had ever
    really been captured. Fixed by giving the custom attribute name its own dedicated, always-
    visible-when-relevant "Please specify" field (matching the same "Other" reveal pattern already
    used everywhere else in this wizard), so Value stays a real, independently-editable field for
    the row's actual value regardless of which Attribute is chosen. Each row also picked up a real
    bordered container (`rounded-lg border border-secondary p-3`) now that it can hold two stacked
    fields instead of one. `isAttributeRowsValid(rows)` (new, exported) centralises "a row is
    complete once it has a real attribute, and a real custom name too if that attribute is
    'Other'" - wired into both consumers' own validity: `species-restriction.tsx`'s `canSave` (only
    when `protectionRule === "specific"`) and `isStep3Valid`'s own `metadata` check. Verified live:
    picked "Other" for a Species restriction's attribute, entered "Nest disturbance window" as the
    custom name and "48 hours" as the real value - both distinct values, both preserved
    independently - saved, and confirmed the populated card correctly showed "Nest disturbance
    window" under Attribute and "48 hours" under Value (previously would have shown the same custom
    name under both). Confirmed the identical fix live on Project Metadata restriction too, since
    it's the same shared component.
  - **Clicking an already-completed step (1 or 2) in the top stepper now jumps back to it**, per
    direct request ("allow the users to go back and forth to step 1 or 2 (completed steps) by
    clicking over it"). `RegistrationStepper` (`stepper.tsx`) gained an `onStepClick?: (step) =>
    void` prop, called only for a step whose `id < currentStep` (i.e. already complete) - the
    current step and any not-yet-reached step stay plain, non-interactive text, unchanged. Wired in
    `page.tsx` via `onStepClick={(target) => goToStep(target, { review: true })}`.
    - **Real bug found and fixed before calling this done**: the button wrapping badge+label for
      the now-clickable case was given its own `flex-1`, which made it compete with the row's
      trailing separator line (also `flex-1`) for the row's leftover width - squeezing the label
      text narrower and wrapping "Project Identification" onto two lines, caught live off a
      screenshot. Fixed by removing `flex-1` from the button (matching the plain, non-clickable
      branch's own wrapper exactly) - only the separator line should ever grow to absorb a row's
      leftover space, same as before this button wrapper was introduced.
    - **Jumping back lands on that step's own Review card, not Question 1** - both
      `Step1ProjectDetails` and `Step2DataCollection` gained a `startAtReview?: boolean` prop, read
      once via a lazy `useState` initializer (`useState(() => startAtReview ? TOTAL_QUESTIONS : 0)`)
      - safe because each component fully unmounts/remounts every time `page.tsx`'s own `step`
      switches away from and back to it, so this is correctly re-evaluated on every visit.
      `page.tsx` tracks a `reviewOnEntry` boolean, set by `goToStep`'s new optional `{ review: true
      }` opts argument - forward completions (`onComplete: () => goToStep(2)`, no `review` flag)
      correctly leave Step 2 starting fresh at Question 1, unaffected by this change; only a
      stepper-header click passes `review: true`. Verified live: completed Steps 1-2, reached Step
      3, clicked "Project Identification" - landed directly on Step 1's own Review card with every
      answer (including the just-tested Start/End Date picks) still intact, not reset to Question
      1. Also confirmed the expected asymmetry: while viewing Step 1's review, "Data Collection and
      Storage" correctly does *not* render as clickable, since `isComplete` is defined relative to
      whichever step is currently being viewed (`step.id < currentStep`) - a deliberate, standard
      wizard-stepper simplification, not a bug; forward navigation to Step 2 still goes through its
      own "Continue" button as before.
  - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on every touched/new file
    (`input-date-picker.tsx`, the new doc page, `lib/nav.ts`, `types.ts`, `data.ts`,
    `step-1-project-details.tsx`, `step-3-privacy-restrictions.tsx`, `attribute-rows.tsx`,
    `species-restriction.tsx`, `stepper.tsx`, `page.tsx`), then an extensive live Chrome pass
    covering every item above in sequence within one continuous wizard run (Start/End Date via the
    new picker, jumping back to Step 1's review via the stepper and confirming data survived, back
    through to Step 3, Embargo multi-select in both directions with the max-date bug fix confirmed,
    the calendar's own min/max enforcement, and the AttributeRows fix confirmed on both Species and
    Project Metadata). Zero console errors throughout the entire pass.

- **Step 3 (Privacy and Restrictions) rebuilt as the same one-question-at-a-time Typeform
  sequence as Steps 1 and 2**, per direct feedback off a screenshot that the Yes/No radio + boxed
  `Accordion` screen didn't match the other two steps. Built on the same shared `TypeformCard`/
  `ChoiceTile` shell (`typeform-card.tsx`), no new components. Sequence: "Does your project have
  any restrictions?" (No / Yes `ChoiceTile`s) -> Yes only: "Which kinds of restriction apply?"
  (the 5 real types as multi-select `ChoiceTile`s, each with an icon - `Hourglass03`/`Feather`/
  `MarkerPin04`/`Database01`/`DotsHorizontal`) -> one focused card per selected type in fixed order
  (the same Embargo/Species/Location/Metadata/Other field sets as before, unchanged) -> a Review
  card (one summary row per answer with an edit-jump link, "Create Project" as the primary action).
  - Cards are tracked by id, not index (`cardId` in `step-3-privacy-restrictions.tsx`) - toggling
    a type changes how many cards follow, so an index would silently point at the wrong card; the
    "Question N of M" count grows/shrinks live with the selection. Deselecting a type still never
    clears its own answers.
  - `isStep3Valid` now also requires at least one selected type when "Yes" is chosen, and at least
    one nominated entry for Species/Location restrictions - the accordion version let an enabled-
    but-empty species/location restriction through silently.
  - `page.tsx`: Step 3's separate Cancel/Back/Save Draft/Create Project footer is gone; Cancel/Save
    Draft now live in the header for all 3 steps (same as Steps 1-2 already did), the card padding is
    unified, and Back from Step 3's first card returns to Step 2's own review card.
  - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean and a live Chrome pass: Yes -> Embargo +
    Other -> filled both -> Review showed correct summaries (embargo types + auto-filled end date,
    the other-restriction text) -> Create Project landed on the success screen, zero console errors.

- **Optional organisation/institution logo upload on Step 1's "Who owns this data?" card**, per
  direct request - shown only when "Organisation / Institution" is picked, directly under the org
  name field. New page-local `logo-upload.tsx` (`LogoUpload`; no DEW file-upload component exists,
  same page-local precedent as the auth flow's profile-picture upload): click or drag-and-drop,
  a preview card with Replace/Remove once picked, and one plain requirements line - PNG, JPG, SVG or
  WebP · Max 2 MB · Square, at least 200 × 200 px · Transparent or white background works best.
  Requirements are enforced on pick, not just stated: wrong type, over 2 MB, or a raster image under
  200 px on either side is rejected with a specific inline error (SVG skips the pixel check, since
  it scales). Stored as `ProjectDetailsState.dataOwnerOrgLogo` (`OrgLogo` - file name, size, and a
  local object URL; no backend), never required for validity; the review card's "Data owner" row
  appends "· logo added" when one is set. Verified `tsc`/`eslint` clean and live: a 50×50 PNG was
  rejected with the exact dimension message, a 400×400 PNG replaced it with a correct preview, zero
  console errors.

- **Step 3's Species and Project Metadata restrictions simplified, and "Attributes" renamed
  "concepts" throughout**, per direct feedback that the species flow was too complex.
  - **Species** (`species-restriction.tsx`, rewritten): the side panel, group-filter chips, the
    "apply custom sensitivity restrictions" checkbox and the All/Specific radio pair are gone. Now:
    one inline species search (real `ComboBox`) -> each pick becomes its own `BentoCard` (newest at
    the top) asking one question, "What should be restricted?", as two `ChoiceTile`s (All concepts /
    Selected concepts) -> "Selected concepts" reveals the shared concept editor -> a required
    justification. An already-sensitive species shows one line naming the real project(s) that
    already restrict it (no expand/collapse). `SpeciesRestrictionEntry` is now
    `{ speciesId, scope: "all" | "selected", concepts, justification }`. The search is blurred
    after a pick - it opens on focus, so otherwise its list reopened over the card just added.
  - **Shared concept editor** (`concept-rows.tsx`, replacing `attribute-rows.tsx`): Concept |
    Value | remove, column labels on the first row only. Each concept declares its value type
    (`ConceptOption.valueType` in `data.ts`): `text` renders an `Input` with a concept-specific
    example placeholder; `multi` renders a real `MultiSelect`. Per direct request only
    **Observer / Contributor** is `multi` for now (options = this build's placeholder persona set,
    `OBSERVER_OPTIONS`); every other concept stays text until its real option list is decided. The
    value field is disabled until a concept is picked, changing concept resets the value, and a
    concept already used on another row isn't offered again (except "Other", which asks for a
    concept name). A blank value means "restrict this concept entirely", so only the concept itself
    is required.
  - **Species-level concepts** (`SPECIES_CONCEPTS`) come from the Occurrence/Observation "Details
    Container" frames in Figma (`YMproGZfrFB5jUqPHPxMhk`, e.g. `1970:145792`/`1970:147841`, under
    node `55:26710`): Location, Observer / Contributor, Date and time observed, Habitat, Life stage,
    Breeding status, Sex, Measurements, Voucher and determiner details, Attached images and files,
    comments, Other. Project Metadata keeps its own list (`PROJECT_METADATA_CONCEPTS`).
  - `isStep3Valid` now also requires every species card to be complete (justification, plus at
    least one complete concept row in "Selected concepts" mode). The review card lists each species
    with its scope and the metadata concepts by name.
  - Verified `tsc`/`eslint` clean and live: added Malleefowl (the one-line "already sensitive in
    BD - 5038" note rendered), switched to Selected concepts, picked Observer / Contributor (value
    became a searchable multi-select; picked 2), added a second row (Observer correctly absent from
    its list), picked Location (value became a text field with the example placeholder), then the
    Project Metadata card with the same editor, then a review showing "Malleefowl (Observer /
    Contributor, Location (coordinates, IBRA region))" - zero console errors. Pre-existing gap hit
    again: pressing Escape in a `MultiSelect` clears its selection (already logged above).

- **Correction to the entry above: the inline species flow was reverted, per direct feedback that
  the right-side panel experience was better.** Back to the earlier shape: "Select Species" button
  -> right `SidePanel` (search, group-filter chips, Sensitive badges, the sensitive warning with
  "View data restriction summary") -> Save returns a summary card to the main screen (Sensitive
  badge, a "Restricted: All concepts / Selected concepts" banner, a Concept | Value table, the
  justification) with "Add another species". The **only** part kept from the redesign is the
  "What should be restricted?" section inside the panel: two `ChoiceTile`s (All concepts /
  Selected concepts, replacing the old checkbox + radio pair) and, for Selected, the shared
  `ConceptRows` editor. Justification is always required.
  - **Value controls now follow Figma's own field types**, read from the Occurrence/Observation
    *Edit* frames (`YMproGZfrFB5jUqPHPxMhk` `1970:145957` / `1970:148058`): `ConceptOption.valueType`
    is `multi` (Figma's "3 Selected": Observer / Contributor, Determiners, Animal/Plant life stage),
    `select` (Figma's "Please Select": Location precision, Sex, Activity, Micro habitat, Voucher
    institution, Data collection method), `boolean` (Figma's Yes/No radios: Gravid, Planted /
    released), `dateRange` (Figma's "Select dates": Date observed, as From/To pickers on their own
    full-width line under the row - two pickers overlapped in one value column), `text` (Other),
    and `none` (withheld whole, no value: comments, attached images and files, permit number, raw
    data storage). Option lists reuse real lists where this build has one (people, collection
    methods, SA Museum / State Herbarium); the rest are illustrative where Figma leaves the
    dropdown unpopulated. Every row now needs a value except `none` concepts.
  - Verified `tsc`/`eslint` clean and live: Select Species -> panel -> Malleefowl (Sensitive badge
    and warning intact) -> Selected concepts -> Gravid (Yes/No radios), Date observed (From/To
    pickers), Activity (dropdown: Nesting) -> Save -> summary card showing "Gravid: Yes", "Date
    observed: From 01/08/2026", "Activity: Nesting", zero console errors.

- **One shared "Location Details" coordinate table everywhere location is shown**, per direct
  request (Projects, Events, Occurrences, Observations). New `app/pages/_shared/
  location-details-table.tsx` (`LocationDetailsTable`): rows Zone / Easting / Northing / Latitude /
  Longitude, columns Coordinate / Entered Value / GDA2020 Equivalent - the format from the user's
  reference screenshot.
  - **Honest values, not placeholders or inventions.** Entered Value shows what each record
    actually stores (latitude/longitude; Zone/Easting/Northing "-" since they weren't entered).
    GDA2020 Equivalent treats those coordinates as GDA2020 (the datum this build's detail pages
    already state), so latitude/longitude carry over and Zone/Easting/Northing are the real MGA2020
    grid position computed by `toMga2020` (Transverse Mercator on GRS80, k0 0.9996) - checked
    against Adelaide's published MGA position (zone 54, E ~280,659, N ~6,132,236). A record with
    no coordinates shows "-" in every cell.
  - **Wired into:** the map-search record-detail sidebar (`record-detail.tsx`) - every record
    type's Location Information now shows the table (previously only Site / Non-Biotic / Community
    had a coordinate table, in a different column/row orientation, and everything else showed a bare
    "Location Details: -"; the old `CoordinatesTable` and the `full` flag are gone), and Project's
    "Data Collection Location"; `project-detail/option-1`'s Locations accordion (real coordinates of
    the same Adelaide Hills project from `searchEvents`); `observation-detail/option-1`'s Location
    Information (its mock OBS094 has no coordinates, so honest dashes; the disabled Shapefile.shp
    link stays under the table). Not wrapped in `DetailRow` on those two pages - `DetailRow` renders
    its value inside a `<p>`, and a `<table>` inside a `<p>` is invalid HTML (a hydration error).
  - Verified `tsc`/`eslint` clean and live on all three surfaces (project-detail Locations, a map
    search Occurrence sidebar, observation-detail) - zero console errors.

- **`/pages/project-detail/option-2` - a fresh, "totally new" project detail redesign, built to sit
  side by side with `project-detail/option-1` for comparison, per direct request** ("Come up with a
  new page that is totally new from the current experience... Create this as a new page. so we can
  compare old option and new option"). Two Figma references (`wer8CgO1UoCH3aQw2jQkdy`) grounded the
  rebuild: node `1938:35405` (the real screen shape - a dark project-identity band, and a tree/table
  view toggle in the main content's own top-right corner) and node `2526:58529` (15 "Details
  Container" frames, one per Event/Occurrence/Observation sub-type, each stacking a read-only view
  of a section directly above a real, *editable* version of the same fields - text inputs,
  "Please Select" dropdowns, an "N Selected" multi-select, a "Select dates" date picker, Yes/No
  radios, and a repeatable Property/Value/Description row editor for Custom Property).
  - **Real editing, introduced for the first time anywhere in this build.** Every other detail
    screen in this codebase (`project-detail/option-1`, `observation-detail/option-1`, the map
    search tool's own `RecordDetailSidebar`) is permanently read-only - `observation-detail/
    option-1`'s own header comment says so explicitly ("This is the VIEWING screen only... editing
    is explicitly future work"). This page builds it: `field-editor.tsx` (`FieldSpec`/`FieldRow`/
    `FieldSection`/`CustomPropertyEditor`) is one generic, data-driven "view a field, edit a field"
    system - a field declares its own type once (`text`/`textarea`/`select`/`multiselect`/`date`/
    `number`/`boolean`/`readonly`) and renders as either a plain label/value row or the matching
    real DEW input (`Input`/`Textarea`/`Select`/`MultiSelect`/`InputDatePicker`/`RadioGroup`/
    `InputNumber`), controlled by whichever mode its own section is in - matching Figma's own
    stacked view-then-edit pattern exactly, generalised so 15 record types don't need 15 bespoke
    forms. `record-fields.tsx` ports the same field vocabulary `record-detail.tsx` already
    established in view-only form into this new `FieldSpec[]` shape, cross-checked directly against
    this session's own edit-mode reference (Occurrence's Taxonomic Type/NSX Code & Species/
    Occurrence Status/Voucher fields, Duration, Observers as a real multi-select) rather than
    invented. Select-type fields need a real option list Figma's own frames never populate (no live
    taxonomy service behind this preview) - each list is this build's own honest, illustrative
    enumeration, the same convention project-registration's `ConceptOption` lists already use.
  - **No real backend exists anywhere in this build, so "Save" commits into a session-only record
    store instead of a server** (`record-store.tsx`, a small React Context over two plain maps -
    field-section values and Custom Property rows, keyed by `${kind}-${id}:${sectionId}`) - the
    same honest "Changes saved... kept for this session only" toast convention project-registration's
    own "Save Draft" already established. One shared store at the page root means the same record
    opened from the Tree view, the Table view, and the Species view (three separate mount points
    for the same underlying record) always shows the same edit, never a stale copy.
  - **Records and Species are real, first-class tabs**, matching the map search tool's own Records/
    Species split brought in per direct request, instead of a tree buried in a contextual sidebar.
    `project-scope.ts` scopes the *same* shared map-search dataset (`search-data.ts`) down to one
    project's own Events/Occurrences/Observations/Resources (via the already-real `rootProjectOfEvent`/
    `rootProjectForParentEventId`) rather than a second, disconnected mock - this page and the map
    search tool can never disagree about the same project's own records. The Species tab reuses the
    real, already-built `SpeciesResultsView` (`species-results.tsx`) directly - that component
    already accepted an external `rows` prop and an `onRowClick` callback with no detail panel of
    its own, so scoping it to `projectOccurrences(project.id)` needed no changes to the shared
    component at all. Records' own Tree view (`records-view.tsx`) nests this project's events by
    `parentId` into a real tree (`buildEventTree`) with each event's own directly-recorded
    Occurrences/Observations as leaves; Table view reuses the shared `ResultsTable`/`MetricTile`
    primitives already proven out for map search, scoped to this project only. Clicking any row in
    either view opens the same real, editable `RecordEditPanel` (a page-local sibling of the map
    search `RecordDetailSidebar`, since that shared component is read-only by design and this page
    specifically needed edit affordances added to it).
  - **A new dark gradient hero banner** replaces option-1's flat white meta row plus separate rail
    card - the same real `bg-gradient-to-b from-brand-900 via-brand-800 via-[63.942%] to-brand-700`
    token treatment `home-dashboard.tsx`'s own greeting banner already established, not a raw hex
    clone of Figma's own dark header - carrying the project's identity and its 4 headline counts
    (Events/Occurrences/Observations/Attached Resources) in one glance. `KpiStat` is a small
    page-local copy of that same file's own `onDark` stat primitive, not cross-imported, matching
    this codebase's "page-local copy for a small, page-scoped primitive" convention.
  - **The contextual sidebar's nested-records tree is gone** - it now lives inside the Records tab's
    own Tree view instead, so the same content isn't shown twice. The sidebar is a plain section
    list (Overview/Records/Species/Details/Restrictions) mirroring the tabs below it.
  - **`search-data.ts` extended**: Adelaide Hills (this page's one concrete project, same as
    option-1) gained its own Block/Ramble/Trap/Custom event siblings under `site-adelaide-1` (it
    previously had only Site/Visit/Transect/Quadrat, borrowing every other sub-type from elsewhere
    in the dataset) plus two matching Occurrence/Observation pairs (Southern Brown Bandicoot -
    already named as a real targeted species for this exact project in `project-detail/option-1`'s
    own Data Collection Scope section, not a coincidence - and Superb Fairywren, a real SA bird) -
    so this one project now demonstrates every real Event sub-type, matching the full breadth shown
    in the Figma reference frame, per this file's own "reuse real events, extend rather than fork"
    convention. Both the map search tool and `project-detail/option-1` were re-verified live
    afterward to confirm neither regressed.
  - Verified `tsc --noEmit` and `eslint` clean on every new/touched file, and a live Chrome pass:
    the Tree view expanding a Site to show every sub-type side by side (matching the Figma
    screenshot's own breadth), the Table view's metric tiles and sub-type chips, the Species tab
    correctly scoped to this project's own 6 species (not the global dataset), opening a Trap
    record's panel and editing its Comment field (Textarea) through Edit -> Save -> a real "Changes
    saved" toast -> the new value persisting in view mode, editing an Occurrence's Taxonomic Type
    (a real "Please Select" dropdown with Fauna/Flora/Fungi) and Occurrence Status (correctly
    pre-seeded to "Present" from the real record), adding a Custom Property row (Property name/
    Value/Description) and confirming it rendered correctly in view mode afterward, the Details
    tab's 5 sections each with their own Edit affordance, and the `public-user` role rendering the
    same page correctly (Log in/Sign up instead of the profile menu) - zero console errors across
    every pass.
  - **Follow-up round, per direct feedback on the shipped page: the contextual sidebar removed,
    the hero compacted, and the fragmented Overview/Details/Restrictions tabs merged into one
    unified Overview built from the real Add Project wizard's own data model.**
    - **Contextual sidebar removed entirely** - the plain section list mirroring the Tabs
      (Overview/Records/Species/Details/Restrictions) was pure duplicate navigation once the Tabs
      already did the same job, flagged directly off a screenshot. `main` now runs full-width next
      to the primary icon rail alone - the same "icon rail + full-width main, no contextual aside"
      shape this build's own guest single-view layout already established elsewhere (see
      CONTEXT.md's "User roles" section), not a new pattern. `NavTree` (only ever used inside that
      aside) was removed as dead code with it.
    - **Hero compacted from a tall stacked block (eyebrow/title, a meta row, a divider, then a
      stat row) to one flex row** - title + a single inline meta line (ID · Start date · status ·
      published by) on the left, the 4 KPI counts on the right, wrapping only at narrow widths.
      `KpiStat` shrank to match (smaller value/label text, tighter gap). Same real dark-gradient
      token treatment, only the internal layout changed.
    - **Overview/Details/Restrictions merged into one "Overview" tab** (now 3 tabs total: Overview/
      Records/Species), per direct feedback ("All details regarding project must be together not
      separated like how it is now"). Built by actually walking the real Add Project wizard
      (`/pages/project-registration?userRole=registered-user`, `project-registration/types.ts`+
      `data.ts`) rather than guessing what it collects - a new `project-registration-data.ts`
      holds this project's data in the wizard's own real state shapes
      (`ProjectDetailsState`/`DataCollectionState`/`RestrictionsState`), reusing its real option
      vocabularies directly (`ROLE_OF_WORK_OPTIONS`/`FOCUS_AREA_OPTIONS`/`PERMIT_TYPE_OPTIONS`/
      `COLLECTION_METHOD_OPTIONS`/`EMBARGO_TYPE_OPTIONS`/`SPECIES_CONCEPTS`/`REGISTRATION_SPECIES`)
      rather than a second, disconnected copy - filled out with values consistent with everything
      this project already says elsewhere (the same abstract, the same Data Owner/Project Manager
      contacts, the same permit, the same real species already tied to it in `search-data.ts`),
      not contradicting option-1 or the map search tool's own facts about it. New fields shown for
      the first time on this page: role of work, full vs. short title, a second Project Manager,
      Project Focus Areas and Targeted Species (real chips), Geographic Extent (method + summary),
      and a real, non-empty Restrictions section (a Project-completion embargo + a Southern Brown
      Bandicoot species restriction with a location-precision concept) - reversing the earlier "no
      restrictions" empty-state framing now that the page needed to demonstrate what registration
      actually produces, not just the honest-empty-state case.
    - **`registration-summary.tsx`** holds the new read-only display cards (`IdentificationRow`,
      `DataOwnerCard`, `ProjectManagersCard`, `DataCollectionCard`, `RestrictionsCard`,
      `GeographicExtentSummary`) plus the label-lookup helpers they share. Deliberately read-only -
      wiring real editing for a multi-select (focus areas, targeted species) or a repeatable
      contact list (project managers) would mean rebuilding the wizard's own editing UI a second
      time inline, a materially bigger lift than this round's actual ask (show the information
      well); logged as a scope line in the file's own header rather than silently attempted or
      silently dropped. What *stays* editable, unchanged from before: Permit Type/No., URI/DOI
      Number, and Custom Property, now seeded with this project's real registration values instead
      of blank placeholders - still real `FieldSection`s wired to the same session-only
      `record-store.tsx`.
    - "All details regarding project" was read as the project's own metadata specifically
      (identity, ownership, data collection scope, permits, restrictions) - Records and Species
      stay their own tabs, since they're genuinely large, distinct datasets (a nested tree/table of
      individual records, a filterable species table), not project-level metadata, and merging them
      in would recreate exactly the "wall of everything" the cognitive-load principles in this file
      warn against.
    - Verified `tsc --noEmit` and `eslint` clean on every touched/new file, and a live Chrome pass:
      the compact hero rendering as one row, no contextual sidebar next to the icon rail, the
      merged Overview tab showing every registration field in order (Identification chip + full
      title, Abstract, Geographic Extent + map, Data Collection with real focus-area and
      targeted-species chips, Permit &amp; Identifiers, Privacy and Restrictions rendering both the
      embargo and the species restriction with their real values, Custom Property), Records and
      Species tabs both still working full-width, and the `public-user` role rendering the same
      unified layout correctly - zero console errors across every pass.
  - **Second follow-up: the dark gradient hero replaced with option-1's own plain header
    treatment, per direct feedback with a screenshot of it** ("I like this way of the project
    header and not the green bar... make it clean like this"). `ProjectHero` is now an eyebrow
    label, the title, and a meta row (Project ID/Start Date/End Date/Status/Published by) with a
    bottom rule - no colour block, no `KpiStat`s. The 4 headline counts the gradient version
    carried are gone rather than moved elsewhere - they're already live on the Records tab's own
    metric tiles, and repeating them in the header would be the exact "same fact, two treatments"
    duplication this file's cognitive-load principles already warn against, so dropping them (not
    relocating them) was the right call once the header itself stopped being a dedicated stats
    surface. `eventCount`/`observationCount`/`resourceCount` and their now-unused
    `projectEvents`/`projectObservations`/`projectResources` imports were removed with it.
  - Verified `tsc --noEmit`/`eslint` clean and a live Chrome pass - the header now renders
    identically in shape to option-1's own (matched directly against the reference screenshot),
    zero console errors.
  - **Third follow-up: the "About" tab (renamed from "Overview" - see below) rebuilt as a left
    sidebar + Typeform-styled card, mirroring the real Add Project wizard's own 3-stage grouping
    instead of one long continuous-scroll page.** Per direct request, with a screenshot of the
    then-current continuous layout and a screenshot of the wizard's own Typeform-style question
    card: "We have three stages and we collect different kind of information in each level. I
    want the same information collected in the same sort of grouping in the project homepage.
    Introduce a left side bar below the header with the three stages... Try to reflect the card
    view (Typeform) style we used in the project registration form." A Figma link
    (`wer8CgO1UoCH3aQw2jQkdy`, node `2536:75323`) was supplied explicitly as inspiration only
    ("come up with the best UX and UI possible") - its screenshot turned out to be a mockup of
    this exact ask (a plain gray sub-nav list under an "About" tab, items "Overview"/"Data
    Collection and Storage"/"Privacy and Restrictions"), confirming the sidebar's item order/
    naming and the "About" tab rename, but not pixel-matched for styling - the card treatment
    came from the registration wizard's own screenshot instead, per the explicit instruction.
    - `detailTabs`' first tab relabelled "Overview" -> "About" (id stays `"overview"`, no route/
      state changes) so it doesn't collide with the new sidebar's own "Overview" item.
    - New `OVERVIEW_STAGES`/`OverviewStageNav`/`StageCard`/`OverviewSection` in `page.tsx` - a
      `w-64` sidebar (`bg-secondary`, rounded, bordered) listing the 3 stages by the exact same
      names/order as `project-registration/stepper.tsx`'s own `STEPS` (Project Identification /
      Data Collection and Storage / Privacy and Restrictions), each with a small icon
      (`File02`/`Database01`/`Shield01`) and a brand-tinted selected state (`ring-1
      ring-[var(--color-brand-500)]`, matching the `ChoiceTile`/`MetricTile` selected-state
      language already established elsewhere in this build). Selecting a stage swaps the content
      of one `StageCard` - a `rounded-2xl border border-secondary bg-primary p-6 sm:p-8` shell
      with a kicker/title/description header, directly copying `TypeformCard`'s own header
      composition (`text-brand-tertiary uppercase` kicker + `text-primary` heading) rather than
      importing that component itself, since this is a static viewer with no Back/Continue/
      progress-bar flow to drive - only its header language needed to carry over, not its
      question-stepping mechanics.
    - **Identification** stage: `IdentificationRow` + Abstract + `DataOwnerCard`/
      `ProjectManagersCard` side by side. **Data Collection** stage: Geographic Extent summary +
      map, `DataCollectionCard`, Permit &amp; Identifiers (`PermitAndUriFields`, already bare),
      Custom Property (`CustomPropertyFields`, renamed from `CustomPropertyCard` and stripped of
      its own `BentoCard`/heading, since the stage card now supplies one). **Restrictions**
      stage: `RestrictionsCard`. Every existing display component/editable `FieldSection` was
      reused as-is - the ask was regrouping and a new outer chrome, not new data or new editing
      surfaces - moving Permit/URI-DOI/Custom Property (previously stacked as their own cards
      alongside Geographic Extent/Data Collection in one long "main column") to sit together as
      Data Collection stage content, matching the real wizard's own step 2 field set exactly
      rather than the ad hoc column split the continuous-scroll layout had used.
    - **`DataCollectionCard`/`RestrictionsCard` (`registration-summary.tsx`) gained an optional
      `bare` prop** (default `false`, so their own still-standalone usage pattern is unchanged in
      spirit) that skips the component's own outer `BentoCard` wrapper and top-level `<h2>` -
      needed once each was nested inside a `StageCard` that already supplies an equivalent
      heading ("Data Collection and Storage" / "Privacy and Restrictions"), avoiding the "same
      fact, two treatments" duplication this file's own cognitive-load principles warn against
      (an inner "Data Collection" `<h2>` directly under an outer, near-identical "Data Collection
      and Storage" heading). Both components are only ever used on this one page (confirmed via
      grep) so this was a safe, contained signature change, not a sitewide one.
    - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on both touched files (`page.tsx`
      needed its now-unused `BentoCard` import dropped once the old continuous layout's direct
      `BentoCard` usage was replaced by `StageCard`), then a live Chrome pass across all 3 stages
      (Identification/Data Collection/Restrictions, confirmed no duplicate headings, the map and
      focus-area chips and permit/custom-property `FieldSection`s all render correctly under Data
      Collection, and the embargo/species restriction cards render correctly under Restrictions),
      re-confirmed the unrelated Records and Species tabs still work exactly as before, and
      checked the `public-user` role renders the same sidebar+card layout correctly - zero
      console errors throughout.

- **`/pages/project-detail/option-3` - a third About-tab exploration, sitting alongside option-1
  and option-2 for direct comparison, per this build's own "create a new page so we can compare"
  precedent.** Prompted by a Figma link (`wer8CgO1UoCH3aQw2jQkdy`, node `2537:75960` - this same
  project's About tab as one continuous scroll under a plain anchor-link sidebar) handed over
  explicitly "for your idea and reference only... I expect you to come up with an even more
  advanced UX UI and visual design" - run through this file's own "Adopting UX patterns from
  external references" workflow (extract the pattern, not the pixels) rather than matched
  literally: what that frame documents is real IA (Identification/Data Collection/Restrictions,
  the same 3 real wizard stages option-2 already grouped by), not a layout worth copying - its own
  single continuous scroll is the literal "flat dump" this file's own cognitive-load principles
  warn against, and copying it as-is would have been a regression from option-2, not an advance.
  - **The actual design move: replace option-2's single-stage-at-a-time switcher with a
    persistent "At a glance" rail plus a multi-open `Accordion` (`variant="boxed"`).** The stage
    switcher's real cost was context loss - clicking "Restrictions" fully replaced "Ownership,"
    so comparing who manages a project against whether it's restricted meant clicking back and
    forth. The rail (Data Owner, primary Project Manager, Geographic Extent, Permit, a
    Restrictions status badge - name/role only, never full contact detail) is always visible and
    never replaced, the same "accepted duplication" precedent already established for
    project-detail/option-1's own `ProjectDetailsCard` rail, just applied to a second exploration
    rather than copied pixel-for-pixel from the first. The Accordion lets more than one of the 3
    real stages stay open at once; Restrictions auto-opens when the project actually has active
    ones and its own collapsed header still carries a live count badge (`2 active`), so that fact
    is visible even collapsed - "a conditional field is conditional in the UI too," surfaced, not
    hidden behind an extra click. Full Title + Abstract moved out of the accordion entirely into
    their own full-width block above the rail/accordion split - the project's own description is
    the one clear focal point of an About tab, not one more row buried inside a collapsed section.
  - **Every real display component option-2 already built was reused as-is, not reinvented** -
    `DataOwnerCard` (already surfaces an org logo when one exists), `ProjectManagersCard`,
    `DataCollectionCard`/`RestrictionsCard` (`bare` mode, already colour-codes Embargo amber and
    Species restrictions neutral via `FeaturedIcon` - genuinely already ahead of the Figma
    reference's own plain notice-card treatment), `GeographicExtentSummary`, `roleOfWorkLabel`,
    `permitTypeLabel`. Confirmed live these were already correct before building anything new
    around them, rather than assuming they needed improving too.
  - **The generic record-editing machinery (`record-store.tsx`, `field-editor.tsx`,
    `record-fields.tsx`, `record-panel.tsx`, `records-view.tsx`, `project-scope.ts`,
    `project-registration-data.ts`, `registration-summary.tsx`) is imported directly from
    `../option-2/` rather than duplicated a third time.** None of it is coupled to option-2's own
    page shell - every piece already takes `project`/data as plain arguments - so this is the same
    "one real dataset, never a second disconnected copy" principle already applied to
    `search-data.ts` across the map search tool, option-1, and option-2, just extended one hop
    further. `option-2` itself was not modified - a pure one-directional import. Only two small
    functions (`PermitAndUriFields`/`CustomPropertyFields`, ~15 lines each) were duplicated locally
    rather than exported from option-2's `page.tsx`, since they weren't exported there and the glue
    was small enough that cross-importing two more single-use functions wasn't worth it.
  - Header/icon rail/Records tab/Species tab are all unchanged from option-2 (same clean flat
    header with no colour band - matching the user's own direct, twice-confirmed preference against
    a dark banner - same Tree/Table Records view, same Species table) - this exploration is scoped
    to the About tab's own layout, per the actual ask, not a full page rebuild.
  - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean, then a live Chrome pass: Ownership
    and Restrictions both open by default and stay open simultaneously, expanding Data Collection
    left both other sections open (confirming the core fix - no more losing context on switch), the
    real Leaflet-adjacent `MapView`/chips/editable Permit `FieldSection` all rendered correctly, the
    rail's restriction badge (`2 active`) matched the accordion header's own badge exactly, Records
    and Species tabs both worked unchanged, and the `public-user` role rendered the guest header
    (Log in/Sign up, no profile menu) with the same About layout - zero console errors throughout.
    Not added to `lib/nav.ts`, per the same "these are working screens, reached by direct URL"
    convention every other `/pages/*` exploration already follows.
  - **Follow-up, per direct feedback on the shipped page: the Accordion swapped for a horizontal
    Tab switcher, the badge-in-front-of-title treatment reworked, the "Comparing layouts" row
    turned into a floating panel, and Geographic Extent rebuilt to match this build's own
    "Location Information" shape used everywhere else.**
    - **Horizontal tabs, not a vertical accordion** ("make the three accordions as a horizontal
      tab"). The real `Tabs`/`TabList`/`Tab`/`TabPanel` (`components/application/tabs/tabs.tsx`,
      `type="button-brand"` - the same real IA-switcher styling already used for Home/Projects
      elsewhere in this build) replaced `Accordion` in `about-content.tsx`. One panel visible at a
      time now (the multi-open advantage is gone), but the Restrictions tab carries a real live
      count badge (`Tab`'s own `badge` prop) so that status is still visible without switching to
      it - the same "a fact worth knowing shouldn't need an extra click" idea the rail already
      applied, now at the tab-label level too.
    - **Full Title no longer has a badge glued in front of it** (flagged directly as awkward).
      Role of Work moved out of the identity block entirely into its own rail row (`Briefcase01`
      icon, "ROLE OF WORK"); Full Title and Abstract are now two plain eyebrow-label-over-value
      fields ("FULL TITLE" / "ABSTRACT", the same `MetaField`-style pattern used everywhere else
      in this build), not one run-on line starting with a chip.
    - **Geographic Extent rebuilt to match the real "Location Information" shape every other
      record type in this build already shows** (`app/pages/_shared/map-search/record-detail.tsx`'s
      own map + `LocationDetailsTable`), replacing the whole-of-Australia `MapView` that never
      actually zoomed to this project's own extent. New `GeographicExtentDetails` in
      `about-content.tsx`: the same real single-point Leaflet map (`sa-map.tsx`'s `SAMap`,
      dynamically imported `ssr:false`) centred on `project.lat`/`project.lon` with a circle
      boundary sized from the real registered extent (`registrationDataCollection.geographicExtent
      .boundary`'s own `radiusKm` when it's a circle, a 1km fallback marker otherwise - a polygon
      extent has no single radius), then the shared `LocationDetailsTable`
      (`app/pages/_shared/location-details-table.tsx`) - Zone/Easting/Northing/Latitude/Longitude,
      Coordinate/Entered Value/GDA2020 Equivalent, the exact same table Projects/Events/
      Occurrences/Observations already share everywhere else. Verified live: the map correctly
      flies from its default whole-state view to a tight fit on the Adelaide Hills extent (pin +
      12km circle) on first open, and the table shows the project's own real `-35.02, 138.71`.
    - **The inline "Comparing layouts: Option 1 | Option 2 | Option 3" text row is gone, replaced
      by a floating panel** ("Make this a floating panel to switch between three options"). New
      `LayoutSwitcher` in `page.tsx` - the exact same FAB + `Dropdown.Root`/`Popover`/`Menu`
      pattern `RoleSwitcher` already established (one click to open, one click to pick,
      `selectionMode="single"` with the current option checked), reusing `useRoleHref()` so
      switching option preserves the current `?userRole=`. Positioned bottom-left rather than
      RoleSwitcher's bottom-right so the two floating panels never overlap.
      - **Real bug caught live, not just by reading the code**: at its first position
        (`bottom-5 left-5`, mirroring `RoleSwitcher`'s own `bottom-5 right-5`), the FAB sat exactly
        under Next.js's own dev-mode indicator badge (also anchored to the bottom-left corner in
        local dev, with a higher stacking context) - clicking the FAB's own screen position
        actually opened the *Next.js* dev panel (Route/Bundler/Route Info/Preferences), not my
        Dropdown, confirmed by clicking and seeing the wrong menu appear. Fixed by moving the FAB
        up to `bottom-24 left-5`, clear of the Next indicator's own small footprint - a dev-only
        collision (the Next badge doesn't render in production) but one worth designing around
        anyway so the control is actually usable while building. Re-verified after the fix: the
        FAB opens its own real menu, and picking "Option 2" navigated to
        `/pages/project-detail/option-2?userRole=registered-user` with the role preserved.
    - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on both touched files
      (`about-content.tsx`, `page.tsx`), then a full live Chrome pass across all 3 tabs (Ownership,
      Data Collection with the new map+table, Restrictions with its badge matching the rail) and
      the floating layout switcher - zero console errors throughout.
  - **Third follow-up, per direct feedback with screenshots: a genuine architecture change, not a
    restyle - the "At a glance" rail gained real clickable record counts, and every other card
    switched from an inline Edit/Save toggle to a hover-only icon that opens a real, expandable
    right-anchored panel ("like Jira").** A prior round attempting a lighter version of the
    editability piece was reverted outright ("revert the changes. I dont like it.") before this
    one - this pass is a from-scratch rebuild against much more specific direction, not a
    reapplication of the reverted one.
    - **"At a glance" gained the real Events/Occurrences/Observations/Artefacts counts**, each the
      exact same `MetricTile` component records-view.tsx's own switcher already uses (not a new
      tile), laid out in one full row per the reference screenshot rather than a cramped grid - the
      rail widened to `lg:w-[540px]` to fit all 4 without truncating labels, per direct permission
      ("Increase the width if needed"). Each tile click calls a new `onNavigateToRecords(tab)` prop
      that switches to the Records tab **and** its Table view (not just the tab), pre-selected to
      that exact entity type - `records-view.tsx`'s `RecordsView` gained a second additive prop,
      `initialViewMode` (alongside the already-existing `initialEntityTab`), both read once on
      mount; `page.tsx` tracks `recordsInitialTab`/`recordsInitialViewMode` state, set together by
      a `goToRecords` handler. Verified live: clicking "Occurrences" in the rail lands on Records'
      Table view with Occurrences already selected and its 7 real rows showing.
    - **Every other card (all of them, per direct instruction - "except at a glance") now shows a
      small icon-only Edit button, top-right, visible only on hover**, opening a real expandable
      `SidePanel` (the same right-anchored slide-over the map search tool's own record-detail
      sidebar already uses) instead of toggling inline edit state inside the card. New shared
      `EditableCard` wrapper (`about-content.tsx`) - a `group relative` wrapper, an
      `opacity-0 group-hover:opacity-100` icon button, and a `SidePanel` with a real expand/collapse
      toggle in its `headerActions` (flipping `widthClassName` between `max-w-md` and `max-w-2xl`) -
      "the right sidebar must be within the window which can be expandable," not a second route.
      Two panels (`GeoExtentPicker`'s own 4-tab layout, `ConceptRows`' 3-column grid) genuinely
      need the wider width to render without their own content overflowing, so those two pass a new
      `defaultExpanded` prop rather than making the user discover the expand button themselves -
      confirmed live (the 4-tab row visibly overflowed the panel at `max-w-md`, fixed once expanded
      by default).
    - **Every edit field now puts its label on the left and its control on the right**, per direct
      reference to a real Figma frame (`wer8CgO1UoCH3aQw2jQkdy`, node `2526:59792` - fetched and
      confirmed live, the same "Details Container" edit-mode frame `field-editor.tsx`'s own header
      comment already cited as this whole system's original design reference, which the actual
      implementation had never matched - every control rendered with its own DEW-component label
      stacked above it instead). Fixed at the shared component level, not duplicated for the About
      tab alone: `FieldRow` (`option-2/field-editor.tsx`) now renders a fixed-width label column
      (`sm:w-44`, matching its own view-mode column exactly, so a row never shifts horizontally
      switching modes) beside a new `FieldControl` sub-component that renders every field type
      (text/textarea/select/multiselect/date/number/boolean) with no visible label of its own, only
      `aria-label`. This is a real, sitewide fix - option-2's own Records/Species edit panel picked
      up the identical correction, confirmed live by opening a real Site record's own edit mode
      there and seeing the same label-left layout, not just in the About tab.
      - `FieldSection` gained two more additive props - `startEditing` (mounts already in edit
        mode, since the panel itself is now the "start editing" affordance, so a second redundant
        inline "Edit" button inside the panel would be wrong) and `onDone` (called by Cancel and
        Save alike, so the wrapping `EditableCard` can close its own panel) - both default to
        `false`/`undefined`, every pre-existing caller (option-2's own Permit/URI-DOI fields,
        `record-panel.tsx`) unaffected.
      - **A real Cancel-doesn't-discard bug caught and fixed before calling this done**: a first
        pass for the multi-manager panel wrote each keystroke straight to the record store (no
        local draft), so Cancel closed the panel without reverting anything it had already
        committed - the same "Cancel discards, Save commits" contract every other panel keeps.
        Fixed with a dedicated `ProjectManagersEditor` component holding its own `useState` draft
        array, seeded once per open, only reaching the store on a real Save.
    - **Privacy and Restrictions rebuilt end to end** (per direct feedback with a screenshot: "this
      is not clear way of representation... use what we have done in project registration form and
      make it better. Also this must be editable"). The old run-on "Location (coordinates):
      Generalise to 10 km" sentence is now a real two-column Concept/Value table (`RestrictionsDisplay`
      in `about-content.tsx`), and the whole section is genuinely editable via one panel
      (`RestrictionsEditor`) that reuses the real registration-wizard components directly rather
      than inventing a second editor: plain label-left `FieldRow`s for Embargo Type (multiselect)/
      Reason/Ends, and the wizard's own real `ConceptRows` component (`project-registration/
      concept-rows.tsx`, the exact same `SPECIES_CONCEPTS` list Step 3 uses) for the species
      restriction's own concept list - "Add concept," per-concept Select+Value controls, and
      per-concept remove, all real and working. Scoped to this project's one real embargo and one
      real species restriction (adding a second species restriction entry stays out of scope, same
      "no fabricated add/remove flow" call already made for Data Owner/Project Manager) - draft
      state lives in `AboutContent`'s own `useState` (not the record-store, since a compound
      `ConceptValueRow[]` doesn't fit its flat `FieldValues` shape), so a save is honestly
      session-only like everything else in this build, just via a slightly different, still-real
      mechanism.
    - **Geographic Extent is now genuinely editable too**, via the real `GeoExtentPicker`
      (`project-registration/geo-extent-picker.tsx` - Upload Shapefile/Draw on the Map/Choose from
      a List/Coordinates, all real) rather than a fabricated second geography picker. The preview
      map/table re-centre on the edited boundary's own circle when the method produces one (drawn
      or entered coordinates); a park or shapefile selection has no single point to re-centre on,
      so the preview honestly keeps showing the project's own real coordinate rather than guessing.
    - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every touched file
      (`about-content.tsx`, `page.tsx`, `option-2/field-editor.tsx`, `option-2/records-view.tsx`),
      then an extensive live Chrome pass: hovered every card and confirmed the icon-only Edit
      button appears only on hover; opened and expanded the Data Owner panel and confirmed the
      real label-left fields; opened Geographic Extent's panel (defaulting to expanded) and
      confirmed the real `GeoExtentPicker`'s 4 tabs render without overflow; opened Privacy and
      Restrictions' panel and confirmed the real pre-populated `ConceptRows` row ("1 selected" ->
      "Location (coordinates)" -> "Generalise to 10 km"); clicked "Occurrences" in the rail and
      confirmed it landed on Records' Table view with Occurrences pre-selected; and reopened
      option-2's own Records panel to confirm the shared `FieldRow`/`records-view.tsx` changes left
      it fully working, just with the corrected label-left layout - zero console errors anywhere.
  - **Fourth follow-up: a real architecture change - the overlay panel became a genuine docked
    column, every edit form became the real registration-wizard `TypeformCard` shell, the header
    was rebuilt to match option-1/2's own real meta-row exactly (with Start/End Date/Status now
    editable), and a live page review (structured "Agentation" feedback plus a Jira reference
    screenshot) surfaced two real bugs and three smaller fixes.**
    - **The right-hand panel is now a real docked column, not an overlay** (per direct feedback
      with a real Jira screenshot: "In Jira it is appearing as a new column. I want a new column to
      the right"). New `edit-column.tsx` - `EditColumn` is a genuine flex sibling of `<main>` in
      `page.tsx` (inside the same `flex flex-1 overflow-hidden` row the primary icon rail and main
      content already share), not a `ModalOverlay`/`Modal`/`Dialog` covering the page - opening it
      visibly shrinks the main content area exactly like Jira's own work-item panel, confirmed live
      by watching the page reflow narrower the instant a card's Edit icon was clicked. One shared
      `EditRequest = { title, render }` slot, lifted to `page.tsx` (the nearest common ancestor of
      both the header and every About-tab card), so only one edit surface is ever open at once,
      same as Jira. Every `EditableCard`'s own hover-icon now calls `onEditRequest(...)` instead of
      managing a local `SidePanel`/`isOpen` state - the per-card expand-width toggle from the prior
      round moved into `EditColumn` itself as one shared 460px/720px toggle.
    - **Every edit form is now the real `TypeformCard` shell the registration wizard itself is
      built from** (per direct instruction: "the edit screen must be same as the project
      registration flow"), not a dense field-row stack with its own Cancel/Save bar - kicker, a
      big `text-display-xs` heading, an optional description, the fields, then Back (doubling as
      Cancel)/Save. Several kicker/title/description strings are the wizard's own real copy for the
      matching question, not invented text: Data Owner -> "Who owns this data?" / "The organisation
      or person responsible for this project's data.", Geographic Extent -> "Where does this data
      come from?" / "Define the geographic extent this project's data collection covers.", Focus
      Areas -> "What kind of data does this project focus on?" / "Biological is always included -
      add any other domains this project also collects data on.", Method -> "How was this data
      collected?", Project Manager/s -> "Who's managing this project day to day?". New shared
      `FieldsEditor` (exported from `about-content.tsx`, reused by `page.tsx`'s own header editor
      too) wraps any flat `FieldSpec[]`/`FieldValues` pair in this shell with real local draft
      state; `GeoExtentEditor`/`RestrictionsEditor`/`ProjectManagersEditor` (compound data that
      doesn't fit a flat field list) each wrap their own bespoke content in the same shell directly.
      - **A real mid-build mistake caught and fixed before calling this done**: a first pass tried
        to share one `FieldGroup` component across every `FieldsEditor`-style call site via a
        `Context` meant to let `EditShell`'s own Save button reach a draft it had no direct access
        to - the context provider's `commit` value was written but never actually invoked from
        anywhere, so those fields silently didn't save at all. Caught by re-reading the code (not
        live), not treated as a valid pattern to keep - replaced with `FieldsEditor` owning its
        `useState` draft directly (the same "local draft, commit on Save" shape every other editor
        in this file already used correctly), which is simple enough to reuse everywhere instead.
    - **The project header now matches option-1/2's own real meta-row exactly** (per direct
      reference to that header, `PROJECT ID`/`START DATE`/`END DATE`/`STATUS`/`PUBLISHED BY` as
      five labelled columns, replacing the one-line "code · Started X · Published by Y" sentence
      this page had used until now) - **and Start Date, End Date and Status are now genuinely
      editable**, via the same hover-icon on the header block itself (per direct request: "There
      must also be an option to change the project start date end date and project status" -
      Project ID and Published By stay fixed identifiers, scoped to exactly the three fields named).
      Real `parseDate`/`DateValue` round-trip (`project.startDate`'s own `"YYYY-MM-DD"` string
      parses and re-serialises losslessly), a real `PROJECT_STATUS_OPTIONS`/`statusColorFor` select
      matching the real status vocabulary already used across this dataset (Active/success, Under
      review/warning, Completed/gray) - not invented options. Verified live end to end: opened the
      header's edit panel, changed Status to "Under review," saved, watched the header's own
      `BadgeWithDot` update to the amber "UNDER REVIEW" pill immediately, and confirmed a fresh
      reload correctly reverted it (session-only, same honesty convention as every other edit in
      this build - no real backend exists to persist it further).
    - **A live page review (a batch of structured "Agentation" feedback, cross-checked against the
      real rendered page at its exact reported viewport/coordinates rather than guessed) surfaced
      five more fixes:**
      - **A real double-card bug** ("there are extra outer containers which is ugly") -
        `DataOwnerCard`/`ProjectManagersCard` (`registration-summary.tsx`) already return their own
        `BentoCard`; this file was wrapping them in a second one. Fixed by giving `EditableCard` a
        `bare` prop (skips its own `BentoCard`+heading wrap for a child that already supplies its
        own complete card) - confirmed live via a zoomed screenshot showing one clean border, not
        two nested ones.
      - **Every card now shares one real heading style** - `EditableCard`'s default (non-`bare`)
        path now always renders a `<h2 className="text-sm font-medium text-primary">`, the exact
        style `DataOwnerCard` already established, so Project Identification/Focus Areas & Targeted
        Species/Method of Data Collection/Permit & Identifiers (previously headingless, reading as
        structurally different from Data Owner/Project Manager) all match now.
      - **The inner Ownership/Data Collection/Restrictions switcher changed from `button-brand` to
        `underline`** - the exact type the outer About/Records/Species tabs on this same page
        already use, per direct feedback ("the tabs are not the same as the DEW design system") -
        confirmed by mapping the reported region coordinates onto a live screenshot at the exact
        reported 1792×1120 viewport before concluding which tab row was meant.
      - **Record-count tiles now wrap Events/Occurrences/Observations onto one row and Artefacts
        onto its own** below, per direct feedback, rather than one cramped or one overly wide row.
      - **The rail's own "Geographic Extent" row was removed** - the one row whose full detail (map
        + table) already sits one click away in the very same tab, and the only row whose text
        wrapped to two lines unlike every other single-line row around it; this specific row wasn't
        named directly in the feedback (a generic `<RailRow>` component reference with no
        distinguishing instance detail), so this is a stated best-effort reading of "remove this"
        rather than a confirmed instruction - flagged directly as an assumption to double-check.
    - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on every touched/new file
      (`about-content.tsx`, `page.tsx`, `edit-column.tsx`), then an extensive live Chrome pass at
      the real reported viewport size: confirmed the docked column genuinely reflows `<main>`
      narrower (not an overlay); opened and saved the header's own Start/End Date/Status editor
      end to end, watching the header's badge update live; opened Data Owner's panel and confirmed
      the real wizard copy and pre-filled fields; confirmed the single-border fix and the new
      shared heading style via a zoomed screenshot; and confirmed the Restrictions tab's own hover
      icon and heading render correctly - zero console errors throughout.
  - **Fifth follow-up: the docked column's own width behaviour, per direct feedback - "the left
    panel need not be responsive. just the right column can be expanded or compressed. The full
    view icon will make the full screen view."** The previous round's column toggled between two
    in-flex-row widths (460px/720px), meaning `<main>` had to keep responsively re-shrinking every
    time the column's own width changed - not what was asked. `edit-column.tsx` now has exactly
    two real states instead: **docked** (a single fixed 460px, `<main>` reflows to make room for it
    exactly once when it opens, never again afterwards) and **full screen** (the same expand icon
    now switches the column out of the flex row entirely into a `fixed inset-0 z-[9999]` overlay
    covering the whole viewport - the same real full-screen technique and z-index this build's own
    `MapFullscreenView`/`GeoExtentPicker` full-screen map already established, needed here for the
    same reason: whatever's still mounted behind it must never be responsible for reacting to it).
    Minimize returns to the one fixed docked width only, never an intermediate size. Verified live:
    opened the header's own editor (docked, 460px, main reflowed once), clicked the expand icon and
    confirmed the column became a true full-page takeover with the main content fully hidden behind
    it (not resized), clicked minimize and confirmed it returned cleanly to the fixed dock with the
    form's own values untouched - zero console errors throughout. `tsc --noEmit`/
    `eslint --max-warnings=0` clean on the one touched file.
  - **Sixth follow-up: the docked column is now genuinely drag-to-resize, per direct feedback with
    a real screenshot ("for the last time.. i want the right dock to be resizable"), referencing
    shadcn's own react-aria-components-based Resizable (ui.shadcn.com/docs/components/aria/
    resizable) as the interaction to match.** `ResizeHandle` (`edit-column.tsx`) is a thin,
    `role="separator"` handle on the docked column's own left edge (a wider `w-3.5` invisible hit
    area around a 1px visible line, brand-coloured on hover/drag - easier to grab than a bare 1px
    line, matching the reference's own handle shape), tracking the pointer's live distance from the
    viewport's right edge (`window.innerWidth - e.clientX`, exactly the column's own width since
    it's flush against that edge), clamped to a real `MIN_WIDTH`/`MAX_WIDTH`, plus ArrowLeft/
    ArrowRight while focused as the same `role="separator"` keyboard affordance a real resizable
    panel carries. The expand icon stays a separate, second way to get more room (the fixed
    `inset-0` full-screen overlay from the fifth follow-up, untouched) - independent of whatever
    width was last dragged to; minimize returns to that dragged width, not a reset default.
    - **A real bug found and fixed mid-build, not just a testing artifact: the first version
      attached the drag's own `pointermove`/`pointerup` listeners inside a `useEffect` keyed off an
      `isDragging` state flag** - `useEffect` only runs after React commits and paints, so there's
      a genuine gap between `pointerdown` and the listener actually going live. A fast drag (a real
      quick flick, or a scripted one whose moves are all dispatched in one task with no yield back
      to the event loop in between) can fire every `pointermove` before that effect ever attaches,
      silently dropping the whole gesture - confirmed live, reproducibly, via this session's own
      browser automation. Fixed by attaching the listeners synchronously inside the `pointerdown`
      handler itself (`window.addEventListener` called directly, not via an effect), plus
      `e.currentTarget.setPointerCapture(e.pointerId)` so every subsequent move stays routed to the
      handler even if the cursor leaves the thin handle mid-drag - the standard, more robust pattern
      for a drag handle regardless of this session's own testing method, not just a workaround for
      it.
    - **`MIN_WIDTH` raised from 380 to 480 (and `DEFAULT_WIDTH` from 460 to 520 to stay above it) -
      a second real bug, caught by actually dragging to the minimum and looking, not by reading the
      code.** At 380px the Start/End Date fields' own calendar-icon trigger was genuinely clipped by
      the panel's edge - traced to `FieldRow` (`option-2/field-editor.tsx`) switching label-above-
      control to label-beside-control at Tailwind's `sm:` breakpoint, which is a *viewport*-width
      media query, not a container query. On a real desktop viewport (always >= 640px here) that
      side-by-side layout never actually stacks no matter how narrow the *panel* itself gets, so the
      panel's own minimum has to leave room for the side-by-side layout rather than assuming it will
      collapse to single-column at small widths. Confirmed fixed via a zoomed screenshot at the new
      480px minimum - both calendar icons render fully.
    - **Live verification needed a different technique than pixel-coordinate dragging, and this is
      worth recording for any future QA pass on a thin drag handle.** This session's own browser-
      automation tool reports screenshots in a downscaled space (1415×840) that does not equal the
      real CSS viewport (confirmed via `window.innerWidth`: 1792) - fine for clicking wide targets
      (a button, a tab) where a few pixels of slop doesn't matter, but the handle's real hit area is
      only ~11px wide in that downscaled space, so estimating its position from a screenshot (even
      via a tight `zoom` crop) repeatedly missed by just enough to land inside the panel instead
      (selecting field text) rather than on the handle - not a product bug, a targeting-precision
      limit of this specific tool for a thin element. Verified the actual mechanism instead by
      dispatching real `PointerEvent`s directly in the page's own JS context (`pointerdown` on the
      handle's own measured `getBoundingClientRect()` center, `pointermove`/`pointerup` on
      `window`, reading the result back off the handle's own `aria-valuenow`) - confirmed a precise
      143px drag produced exactly a 143px width change, confirmed dragging far past either end
      clamps to exactly 480 and 920, and confirmed a live screenshot at the clamped minimum shows
      the fixed date-icon clipping resolved. Zero console errors on a fresh reload. `tsc --noEmit`/
      `eslint --max-warnings=0` clean on the one touched file.
  - **Seventh follow-up: the About tab rebuilt around a real left vertical stage nav (per a fresh
    Figma reference, `wer8CgO1UoCH3aQw2jQkdy` node `2556:77520`), and the docked column's own width
    is now clamped so `<main>` can never be squeezed below a real minimum - direct feedback with
    the reference link: "There is a left vertical tab to switch between overview, data collection
    and storage... if i click on edit on overview we will be able to edit the overview content like
    the project registration flow... same way for published by, project manager etc... the main
    content area content is breaking when i resize the right edit panel."**
    - **Layout rebuilt to match the reference exactly**: a persistent left nav (Overview/Data
      Collection and Storage/Privacy and Restrictions) beside one stage's content, replacing the
      prior round's horizontal `Tabs` switcher + separate "At a glance" rail. Reused option-2's own
      already-established `OverviewStageNav`/`StageCard` visual language (`wer8CgO1UoCH3aQw2jQkdy`
      is the same file; option-2's read-only `OverviewSection` already builds this exact nav+card
      shell) rather than inventing a new one - not cross-imported, since option-2's version has no
      edit affordances and every card here still needs the `EditableCard` hover-icon wiring.
    - **Overview stage matches the reference's own field set exactly**: Role of Work/Full
      Title/Abstract/Start Date/End Date/Status as one edit-triggered field list, a compact
      vertical `RecordCountsCard` beside it (the same real Events/Occurrences/Observations/
      Artefacts & Attachments counts, reusing the already-real `MetricTile`, each a click into
      Records' Table view pre-selected to that type), then Published By + Project Manager/s side by
      side below - matching the reference's Full Title/Abstract/Start-End-Status/counts-card/
      Published-By/Project-Manager arrangement precisely. The old separate "At a glance" rail
      (role of work/data owner/project manager/permit/restrictions as a persistent sidebar) is
      gone - its content is now either part of the Overview field list directly, or the record
      counts card, matching what the reference actually shows rather than a bespoke summary.
    - **Start Date/End Date/Status are now editable from *two* places - the header's own hover-icon
      (unchanged from the fifth follow-up) and the new Overview card - and both read/write the
      exact same session-store section (`event-<id>:header`), so they can never drift out of
      sync.** `PROJECT_STATUS_OPTIONS`/`parseProjectDate`/`statusColorFor` moved from `page.tsx`
      into `about-content.tsx` and are now exported from there (page.tsx already imports
      `AboutContent`/`FieldsEditor` from that file, so this keeps the dependency one-way rather
      than introducing a circular import). Verified live: changed Status to "Under review" from the
      Overview panel's own editor and confirmed the header's badge updated to the amber "UNDER
      REVIEW" pill in the same render, not just the Overview row.
    - **`DataOwnerCard` (option-2/registration-summary.tsx) gained an optional `heading` prop**
      (default `"Data Owner"`, so option-2's own usage is untouched) so this page could relabel the
      visible card heading to "Published By," matching the reference exactly, without hand-rolling
      a second copy of the card or renaming the shared component's default text out from under
      option-2.
    - **The docked column's own width is now clamped against a real `<main>` minimum, not just its
      own `MIN_WIDTH`/`MAX_WIDTH`** - the actual bug behind "the main content area content is
      breaking when i resize." `edit-column.tsx` gained `MAIN_MIN_WIDTH` (760) and `ICON_RAIL_WIDTH`
      (64, matching the primary nav's own fixed `w-16`), plus `dockedMaxWidth()`/`canDock()`: while
      docked, dragging (and the keyboard resize) now clamps to `min(MAX_WIDTH, window.innerWidth -
      ICON_RAIL_WIDTH - MAIN_MIN_WIDTH)` instead of the flat `MAX_WIDTH` - the resize genuinely
      "stops" once `<main>` would drop below its own minimum. On a viewport too narrow to dock at
      all without already violating that minimum (`canDock()` false), the column switches to a true
      floating overlay instead (`fixed inset-y-0 right-0 z-[500] shadow-2xl`, no longer a flex
      sibling of `<main>`, which is left at full width underneath) - the "or float on top" half of
      the request. Both states are recomputed live on window resize (not just on open), re-clamping
      the current width down if the window shrinks while the panel is already open.
    - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on every touched file
      (`about-content.tsx`, `page.tsx`, `edit-column.tsx`, `option-2/registration-summary.tsx`),
      then a live Chrome pass: confirmed all 3 stages render and switch correctly (Overview/Data
      Collection and Storage with its map+table/Privacy and Restrictions with its own "2" badge
      matching the sidebar's), opened the Overview editor and confirmed it's the real `TypeformCard`
      shell with all 6 fields, changed Status there and watched the header badge update in the same
      render, and confirmed the docked resize clamp at the real 1792px viewport: dragging to the
      extreme correctly stopped at exactly 920px (this viewport's own `dockedMaxWidth()`, still
      within the flat `MAX_WIDTH` cap) leaving `<main>` at exactly 808px (1792 - 920 - 64, matching
      the formula precisely) - confirmed via `getBoundingClientRect()`/`aria-valuenow`, not just a
      screenshot. Floating-mode's own trigger condition was verified by simulating a narrower
      viewport (overriding `window.innerWidth` to 1250 and dispatching a real `resize` event, since
      this session's browser-automation `resize_window` tool does not actually change the page's
      real rendering viewport in this environment - confirmed separately via `window.innerWidth`
      staying at 1792 after the call, a tooling limitation worth remembering for any future viewport
      test on this page): the column correctly switched to `position: fixed` with its width reduced
      to the real `MIN_WIDTH` (480), confirmed via `getComputedStyle`, not assumed from the class
      list alone. Zero console errors on a genuinely fresh tab (a stale Turbopack chunk cached in an
      older tab briefly showed a false "defined multiple times" build error from before this
      change; `tsc`, a server-side `curl`, and a fresh tab all confirmed it was a client-cache
      artifact, not a real duplicate-declaration bug).
  - **Eighth follow-up: the left nav's styling corrected to match a fresh Figma fetch exactly, a
    real data-model correction to where "Role of Work" belongs, and Privacy and Restrictions
    rebuilt to reuse the real Add Project wizard's own multi-step flow directly - per direct
    feedback with two Figma links (node `2556:77520` re-fetched, plus `2556:78633` specifically
    showing "the role of work for Olivia") and a set of project-registration screenshots: "Follow
    the same styling for the left tabs... The field called Role of work actually belongs to the
    project publisher's contact details. Always remember this... For privacy and restriction -
    refer to what we have done in project registration screens... it's best you refer to the
    project registration flow to come up with the edit flow."**
    - **Left nav restyled to match the reference exactly** - the active item was a brand-tinted
      `bg-primary shadow-xs ring-1 ring-[var(--color-brand-500)]`, a guess from the first build of
      this layout; the actual reference uses a plain neutral `bg-primary_hover` + `shadow-xs`, no
      ring at all, and there's no restriction-count badge anywhere in the nav (also removed, along
      with the now-unneeded `Badge` import).
    - **"Role of Work" moved off the Overview field list entirely, onto the Published By card's own
      primary contact** - confirmed directly from the second Figma link's own generated markup:
      `roleOfWork` ("Management") renders as a "· Management" suffix next to Olivia Wyatt's name in
      the "Published By" card (node `2556:78633`), the exact same treatment
      `ProjectManagersCard` already gives each manager's own role - not a bare top-level "Role of
      Work: Management" row. `DataOwnerCard` (`option-2/registration-summary.tsx`, shared with
      option-2) gained an optional `primaryRole` prop (undefined by default, so option-2's own
      usage is completely unaffected) that decorates the first contact's row with the same
      "Primary" pill + "· role" suffix `ProjectManagersCard`'s row already uses; `ContactRow`
      gained matching `isPrimary`/`role` props plus a `contact.organisation` team line. `roleOfWork`
      editing moved from the Overview panel's `FieldsEditor` to the Published By panel's, as
      `primaryRole` (a `ROLE_OF_WORK_OPTIONS` select) - the Overview field list is now exactly
      Full Title/Abstract/Start Date/End Date/Status, matching the reference's own "Project
      Details" card (node `2557:78744`) precisely, wrapped in a new `ProjectDetailsCard` (icon
      circle + heading + divider, the reference's own shape) instead of the previous headingless
      `bare` field list.
    - **`ContactPerson` (project-registration/types.ts) gained an optional `organisation?: string`
      field** - additive, so every existing wizard step/consumer is unaffected (nothing in the real
      Data Owner editing step reads or writes it today; it's a display-only detail a caller can set
      directly on seed data, mirroring `ProjectManager.organisation`, which already supports
      exactly this per manager). Set to `"DEW Biodiversity Team"` on this project's real Data Owner
      contact in `project-registration-data.ts` - the exact value the Figma reference shows under
      Olivia Wyatt's own row, confirmed as real (not fabricated) since `ProjectManager` Maya
      Dewitt already carries the identical value in this same file.
    - **Privacy and Restrictions now reuses `Step3PrivacyRestrictions` (the real Add Project
      wizard's own Step 3 component) directly, docked in the same `EditColumn`** - not a bespoke
      edit form rebuilt a second time. This is what makes "add more restrictions as well, not just
      edit the existing" real: the wizard's own "Which kinds of restriction apply?" multi-select
      and its own "Add another species"/"Add another Location" flows are the actual add mechanism.
      `Step3PrivacyRestrictions` gained two additive props, `reviewNextLabel`/`reviewTitle` (both
      default to the real wizard's own "Create Project"/"Ready to create your project" copy, so the
      registration flow itself is untouched) - option-3's `RestrictionsEditor` passes `"Save
      changes"`/`"Review restrictions"` instead, since this is editing an existing project, not
      creating one. The component's own local `summaryFor` closure was extracted to two new
      exports, `restrictionSummaryFor`/`restrictionsSummaryRows` (and `RESTRICTION_TYPE_META`
      itself exported) - the one shared source for both the wizard's own review card and option-3's
      static `RestrictionsDisplay`, so the two can never list a project's restrictions differently.
      `RestrictionsState` (the real wizard type) replaced the old bespoke `RestrictionsDraft`
      interface entirely - `about-content.tsx` lost ~140 lines of hand-rolled embargo/species
      field-row and `ConceptRows` wiring that now lives in exactly one place (the wizard's own Step
      3 file) instead of two.
    - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on every touched file
      (`about-content.tsx`, `page.tsx`'s own re-exported `PROJECT_STATUS_OPTIONS`/
      `parseProjectDate` imports unaffected, `option-2/registration-summary.tsx`,
      `project-registration/step-3-privacy-restrictions.tsx`, `project-registration/types.ts`,
      `option-2/project-registration-data.ts`), then an extensive live Chrome pass: confirmed the
      left nav's active state now reads as a plain neutral highlight (no brand ring), confirmed the
      Overview stage matches the reference layout exactly (a bordered "Project Details" card with
      no Role of Work row, the record-counts card beside it, Published By showing "Olivia Wyatt
      PRIMARY · Management" + "DEW Biodiversity Team" + email/phone, Project Manager/s unchanged),
      and ran the full add-a-restriction flow end to end through the real docked wizard: opened the
      existing Yes/Embargo/Species state pre-filled correctly, additionally selected "Restrict data
      based on Locations" (question count live-updated 4→5, proving the dynamic card-list logic
      still works when reused this way), stepped through the pre-filled Embargo and Species cards
      unchanged, filled in a brand-new location via the real "Nominate Sensitive Location" panel
      (Choose from a List → Belair National Park + a real justification), reached the Review card
      showing all 4 rows with the correct "Save changes" label, saved, and confirmed the on-page
      display immediately showed all three restrictions including the newly added location one -
      zero console errors throughout. Also re-verified `project-detail/option-2` (which shares
      `DataOwnerCard`/`ContactPerson`) still renders its own Overview tab correctly with no role
      suffix/badge shown (since it never passes the new `primaryRole` prop) - confirming the shared
      changes are genuinely additive, not a regression.
  - **Ninth follow-up: the left vertical stage nav's own styling replaced with the real DEW
    `Tabs`/`TabList`/`Tab` component (`type="button-border"`, `orientation="vertical"`) instead of
    hand-copied colours - per direct request with a side-by-side reference: "Could you come up with
    the same styling for this [the left vertical nav]? The reference provided is a horizontal tab
    but this here is a vertical tab but the look and feel must be consistent," pointing at the
    boundary-method tab row ("Upload Shapefile / Draw on the Map / Choose from a List /
    Coordinates") already built on `GeoExtentPicker`.** That row is this exact component/type
    already (`geo-extent-picker.tsx`'s own `<TabList type="button-border" size="sm">`), just
    horizontal - `button-border` is one real type shared by both `HorizontalTypes` and
    `VerticalTypes` in `components/application/tabs/tabs.tsx`, so switching `AboutStageNav` to the
    same component with `orientation="vertical"` reuses the identical tray (`bg-secondary` +
    `ring-1 ring-secondary`, rounded) and selected-pill (`bg-primary_alt` + `shadow-sm`) styling
    automatically, rather than a second hand-matched copy of the same colours that could drift from
    the real component over time. This also replaces the eighth follow-up's own `bg-primary_hover`
    Figma-nav guess, since the real shared component is a strictly better source of truth once one
    exists for this exact look. `cx`, now unused once the hand-rolled `<nav>`/`<button>` markup was
    removed, was dropped from the file's imports. Verified `tsc --noEmit`/`eslint
    --max-warnings=0` clean, then a live Chrome pass on a fresh tab (an older tab's console briefly
    surfaced the same stale-Turbopack-chunk artifact already documented in the seventh follow-up -
    confirmed harmless the same way, via a fresh tab showing zero errors): clicked through all 3
    stages (Overview/Data Collection and Storage/Privacy and Restrictions) and confirmed each
    correctly shows the real `button-border` selected treatment (light pill, subtle shadow, bold
    text) with the two inactive rows reading as plain muted text, matching the reference's own
    "look and feel" - zero console errors.
  - **Tenth follow-up, per direct feedback with a screenshot of the ninth follow-up's own real-
    `Tabs` nav: "Too much spacing inbetween. and alo the the padding within is looking very tight.
    Fix it. plus make the left tabs sticky on scroll. For all the editable containers, I want the
    container color to change to bg-hover on hover." Four fixes, one real bug found along the way.**
    - **The "too much spacing" turned out to be a real sizing bug in the shared `TabList`
      component, not the inter-tab gap** (measured live via `getBoundingClientRect`/
      `getComputedStyle`: the tray's own inter-tab `gap-1`/`p-1` were both tight, ~4px, consistent
      with the *second* complaint about padding being too tight - the actual dead space was
      between the tray and the content card next to it). `components/application/tabs/tabs.tsx`'s
      `TabList` sets `orientation === "vertical" && "w-max flex-col"` - an explicit `width:
      max-content` that overrides the parent `Tabs` wrapper's `flex flex-col` `align-items:
      stretch`, so the tray never actually filled the intended `lg:w-64` column, leaving a real gap
      of dead space between the tray's own right edge and `StageCard` next to it. Fixed locally in
      `AboutStageNav` (`about-content.tsx`) via `TabList`'s own `className="w-full"` - the shared
      component's `cx` is `tailwind-merge`, so a caller-supplied `w-full` reliably wins over the
      component's own `w-max` for the same CSS property, no `!important` needed, and no change to
      the shared component's own default (`GeoExtentPicker`'s horizontal reuse of this exact type/
      size is untouched).
    - **Padding increased directly on each `Tab`** (`className="w-full py-3 px-3.5"`, up from the
      shared `sizes.sm["button-border"]` default of `py-2 px-2.5`, tuned for a short horizontal
      label rather than this taller vertical list) - `Tab`'s own `className` prop merges through
      the same `cx`/`tailwind-merge` path, so this is a local override, not a change to the shared
      component's global sizing table.
    - **Sticky nav**: `AboutStageNav`'s outer `<Tabs>` wrapper gained `lg:sticky lg:top-6` - safe
      because the parent row (`<div className="flex flex-col gap-4 lg:flex-row lg:items-start">`)
      already uses `lg:items-start`, so the nav column was never stretched to the content's full
      height in the first place. Verified live: scrolled the Data Collection stage's long content
      (map, location table, focus areas, method, permit) and confirmed the nav stayed pinned near
      the top of the viewport throughout.
    - **Hover background on every editable container**: `EditableCard`'s own non-`bare`
      `<BentoCard>` (covers Geographic Extent, Focus Areas & Targeted Species, Method of Data
      Collection, Permit & Identifiers, Privacy and Restrictions) and the page-local
      `ProjectDetailsCard` (Overview's own field-list card) both picked up
      `transition-colors group-hover:bg-primary_hover` directly, relying on the existing outer
      `<div className="group relative">` wrapper `EditableCard` already renders. The two shared
      cards used by both option-2 and option-3 - `DataOwnerCard`/`ProjectManagersCard`
      (`option-2/registration-summary.tsx`) - gained a new optional `hoverable?: boolean` prop
      (default off) applying the same class conditionally, and only option-3's own call sites pass
      it, so option-2's own read-only Overview page is unaffected. `BentoCard` itself
      (`app/pages/_shared/bento-card.tsx`) has no base `bg-*` class, confirmed by reading it first,
      so this was a purely additive change with no cascade-order risk.
    - Verified `tsc --noEmit` and `eslint --max-warnings=0` clean on both touched files
      (`about-content.tsx`, `option-2/registration-summary.tsx`), then a live Chrome pass on a
      fresh tab: zoomed into the nav and confirmed the tray now fills its column with no dead space
      and visibly roomier per-tab padding; scrolled the Data Collection stage and confirmed the nav
      stayed sticky; hovered "Permit & Identifiers" and the Overview stage's "Project Details" card
      and confirmed both tint `bg-primary_hover` and reveal their edit icon on hover; re-checked
      `project-detail/option-2`'s own Data Owner card and confirmed it stays plain white on hover
      (no `hoverable` passed there) - zero console errors throughout.
  - **Eleventh follow-up, per direct feedback with a screenshot of the shipped Privacy and
    Restrictions card: "separate editable container for each restriction types and an option to
    add more restrictions if required. a way to remove a restriction already configured."** The
    single "Privacy and Restrictions" card used to open the *entire* wizard sequence for any edit,
    with no way to remove one already-configured type without stepping through the whole flow -
    now each enabled type (Embargo, Species, Locations, Project Metadata, Other) is its own row
    with its own hover-only Edit and Remove icons, plus a standing "+ Add restriction" row.
    - **`step-3-privacy-restrictions.tsx` gained three new exports, extracted rather than
      duplicated**: `RESTRICTION_TYPE_META`/`TYPE_CARD_TITLES`/`isTypeValid` (already existed,
      just made `export`), and a genuinely new `RestrictionTypeFields({ typeKey, value, onChange
      })` - the exact per-type field JSX (Embargo's `MultiSelect`+`Textarea`+`InputDatePicker`
      with its own max-duration logic, `SpeciesRestrictionSection`, `LocationRestrictionSection`,
      the metadata `ConceptRows`, the plain Other `Textarea`) pulled out of the wizard's own
      per-type card render into its own component, including the embargo end-date
      "has the user manually touched this" tracking (now a self-contained `useState` inside
      `RestrictionTypeFields` itself, correctly reset per standalone edit session). The main
      `Step3PrivacyRestrictions` sequence now renders `<RestrictionTypeFields typeKey={key}
      value={value} onChange={onChange} />` in place of the ~90 lines of inline JSX it used to
      carry - one real implementation, not two that could drift, reused by both the full
      onboarding wizard and `project-detail/option-3`'s own new per-type editors.
    - **`about-content.tsx`**: `RestrictionsDisplay`/`RestrictionsEditor` (the old single-card
      pair) replaced with `RestrictionsSection` (lays out one `RestrictionTypeRow` per enabled
      type plus the "Add restriction" row), `RestrictionTypeRow` (the warning-tinted row itself,
      `group relative` with two hover-only icon buttons - Edit02 opens that one type's editor,
      Trash01 removes it immediately from `enabledTypes`, same "no confirm dialog" precedent this
      exact wizard's own Species/Location/Project-Manager "Remove" buttons already establish),
      `RestrictionTypeEditor` (a real `EditShell`+`RestrictionTypeFields` pair, gated by the
      shared `isTypeValid`, scoped to exactly one type), and `AddRestrictionEditor` (an
      `EditShell` wrapping a `ChoiceTile` multi-select grid of only the *not-yet-enabled* types -
      picking one or more and saving merges them into `enabledTypes` with `hasRestrictions: true`,
      landing as new rows reading an honest "Needs setup - click Edit to finish" until their own
      Edit panel is filled in). `EditShell` itself gained a small additive `nextDisabled` prop
      (default `false`, every other caller unaffected) so both new editors can correctly grey out
      Save until valid. The outer "Privacy and Restrictions" wrapper is now a plain heading-only
      `BentoCard` (no single edit affordance of its own, since editing is now per-row) instead of
      the old single `EditableCard`.
    - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean on both touched files, then a live
      Chrome pass: hovered the Embargo row and confirmed both Edit/Remove icons appear; opened its
      Edit panel and confirmed it's scoped to just Embargo, pre-filled with the real "1 selected"
      type, reason text, and end date; opened "Add restriction" and confirmed it offered only the
      3 remaining types (Species/Embargo correctly excluded) with Save disabled until one was
      picked; picked "Restrict data based on Locations," saved, and confirmed a new row appeared
      reading "Needs setup - click Edit to finish"; opened its own isolated editor (the real
      "Which locations are sensitive?" panel, Save correctly disabled while empty); closed it and
      clicked its Remove icon, confirming the row disappeared immediately, Embargo/Species stayed
      untouched, and "Add restriction" once again offered all 3 remaining types. Re-verified the
      real Add Project wizard (`/pages/project-registration`) still loads with zero console errors
      after the shared-component extraction - zero console errors anywhere in this round.
  - **Twelfth follow-up, two direct corrections to the eleventh follow-up above: "the journey you
    created for adding a restriction is wrong... first you choose the restriction types and then
    you hit continue and then you define each restriction type" - the previous round's
    `AddRestrictionEditor` picked types and saved in one single step, leaving new rows sitting
    incomplete rather than actually stepping through each one. And: "you can simply allow for the
    users to remove a restriction... there must be a confirmation taken before removing a
    restriction... written in the best UX writing approach" - the previous round's Trash01 button
    removed a row with no confirmation at all.**
    - **`AddRestrictionEditor` rebuilt as the real multi-step sequence, matching
      `Step3PrivacyRestrictions`' own "any" → "types" → per-type-card shape exactly** (re-read
      directly from `step-3-privacy-restrictions.tsx` before rebuilding, not assumed): step 1 is
      the same "Which kinds of restriction do you want to add?" `ChoiceTile` multi-select
      (`showQuestionCount` now defaulting to true, so it reads "Question 1 of N" like every other
      wizard card, not the flattened single-step version the eleventh follow-up shipped); Continue
      moves into one focused `RestrictionTypeFields` card per newly picked type, in
      `RESTRICTION_TYPE_META`'s own fixed order, each with real Back/Continue and the same
      `isTypeValid` gating the main wizard uses - only the very last card's button reads "Save"
      (every other reads "Continue"), which then commits every newly picked type's filled-in data
      to `enabledTypes` in one write. Deliberately skips a closing Review card - the outer
      restrictions list this panel sits on top of already serves as the review, so a second one
      inside the panel would be a duplicate.
    - **Removal now opens the real `DestructiveModal`** (`components/application/modals/modal.tsx`
      - already a genuine component in this library, not built new) instead of removing
      immediately. `RestrictionsSection` tracks `pendingRemove: RestrictionTypeKey | null`; the
      Trash01 button sets it instead of calling remove directly, and one shared modal at the
      bottom of the section renders when it's set, naming the specific type being removed. Copy,
      written to name the exact thing and its exact consequence rather than a generic "Are you
      sure?": title `Remove "{title}"?`, description `This project's data will no longer be
      restricted by "{title}", and everything you've entered for it will be lost.`, buttons
      `Remove restriction` (destructive) / `Keep restriction` (a specific, paired verb rather than
      a bare "Cancel").
    - Verified `tsc --noEmit`/`eslint --max-warnings=0` clean, then a live Chrome pass: opened "Add
      restriction," multi-selected 2 remaining types (Locations + Other Restrictions), confirmed
      "Question 1 of 3" then Continue moved to "Question 2 of 3 · Restrict data based on
      Locations" with Continue correctly disabled until a location was nominated (used the real
      "Nominate Sensitive Location" panel end to end - name, "Choose from a List" → Belair National
      Park, justification), advanced to "Question 3 of 3 · Other Restrictions" and confirmed the
      button read "Save" (not "Continue"), filled the required text and saved - both new rows
      landed with their real, filled-in summaries, not an incomplete placeholder. Then hovered
      Embargo's row, clicked Trash01, confirmed the `DestructiveModal` opened reading `Remove
      "Embargo"?` with the exact consequence copy above; clicked "Keep restriction" and confirmed
      the row was untouched; reopened it and clicked "Remove restriction," confirming the row was
      removed only after that explicit confirmation. Zero console errors throughout.
  - **Thirteenth follow-up: a real, sitewide `MetricTile` sizing bug, caught off a screenshot of
    the Overview stage's `RecordCountsCard`** ("fix the width for each item on this") - each of the
    4 stacked Events/Occurrences/Observations/Artefacts & Attachments tiles was shrink-wrapped to
    its own label width instead of sharing one consistent full width, so the card read as a ragged
    column of differently-sized pills rather than a clean stack. Root cause: `MetricTile`'s own
    root `<button>` (`app/pages/_shared/map-search/metric-tile.tsx`) only had `flex-1` for sizing,
    which shares row width correctly when the parent is itself a real flex row (`flex items-stretch
    gap-2`, the shape both of this component's other two consumers - the map search Records
    switcher and the Species taxonomic-group tiles - already use) but is inert as a plain block
    child, which is exactly what `RecordCountsCard`'s own `<div className="w-full">` wrappers are
    (a `flex flex-col` stack, not a row). Fixed by adding `w-full` directly to the button's own
    className alongside `flex-1` - a no-op inside a real flex row (`flex-1`'s own `flex-basis: 0%`
    already wins there) and the actual fix for the plain-block case. One shared component, one
    fix, no per-consumer special-casing. Verified `tsc --noEmit`/`eslint --max-warnings=0` clean,
    then a live Chrome pass across all 3 real consumers: `project-detail/option-3`'s Overview stage
    now shows all 4 tiles at the exact same full width (matching the reference screenshot); the map
    search Records switcher (Projects/Events/Occurrences/Observations/Artefacts and Attachments)
    and the Species view's Mammal/Bird/Reptile/Amphibian/Plant tiles both still render identically
    to before, confirming the shared fix didn't regress either flex-row consumer - zero console
    errors anywhere.
  - **Fourteenth follow-up: the Overview stage now responds to the docked edit column, not the
    viewport, per direct feedback off a screenshot of it breaking at the column's widest drag.**
    Every layout switch in `about-content.tsx` was a viewport breakpoint (`lg:`/`sm:`), but opening
    or widening the docked column shrinks `<main>` while the viewport stays the same size - so the
    page kept its full desktop layout squeezed into ~800px (Project Details' value column wrapped
    one word per line and ran under the record-counts card). Switched to container queries: the
    About content is `@container/about` (the stage nav stacks above the card below `@4xl`), each
    stage's body is `@container/stage` (Project Details and the counts card sit side by side from
    `@3xl`, Published By / Project Managers from `@2xl`). The shared `FieldRow`
    (`option-2/field-editor.tsx`) is now its own `@container` too, putting the label beside the
    value only when the row itself is at least `@md` wide - which also fixes the same squeeze inside
    the edit column's own forms, and changes nothing for option-2 at normal widths. Contact emails
    in `DataOwnerCard`/`ProjectManagersCard` stay on one line and truncate with the full address as
    a hover title. Verified `tsc`/`eslint` clean and live with the column dragged to its 920px
    maximum (`<main>` at 808px): stacked nav, readable Project Details, counts card below it, a long
    email truncated on one line - zero console errors.