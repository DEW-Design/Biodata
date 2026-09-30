# 2026-09-23 - Data Licencing Agreement (DLA) workflow built at `/pages/dla`, following the same "List ->

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