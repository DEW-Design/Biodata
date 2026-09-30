# Archive: .claude/rules/ref-shell.md as it stood on 2026-09-29, before the trim

Not loaded into sessions. The whole file, verbatim, from before it was cut down to current practice (context/decisions/2026-09-29-32). Much of it describes routes that no longer exist (the `option-1` shells, normalised away on 2026-09-21), column 2 as status buckets (now a My/All scope switch with status as a filter), and record pages before CONTRACTS §4.6. Read it for why something is the way it is, never for how to build it now.

<!-- Moved verbatim from CONTEXT.md on 2026-09-29, unchanged. Hand-maintained: edit in place. -->

# Reference: building screens in the shell

Cognitive-load principles, exploratory page layouts, the build hierarchy, the list -> deep dive pattern, adopting external UX references, the backlog, the registered-user dashboard scope. Rules live in CONTRACTS.md; this is the reasoning and the how-to behind them.

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
- **Superseded bullets moved out.** Four bullets (the nav-chrome exemption, the history of Projects becoming a leaf, `public-user` across the option-1 shells, and the project-detail rejected-options list) are in `context/archive/exploratory-layouts-history.md`, unchanged.
## Build hierarchy: components -> shell -> screens -> flows

Four distinct layers, each built from the one below it - stated explicitly so a new screen coming
in from Figma always gets built in this order, not assembled ad hoc:

1. **Components (`components/base/**`, `components/application/**`)** - the DEW layer, ingested
   once via the "New component workflow" above, styled entirely through `--ui-*` tokens. Never
   patched to serve one screen's specific need - see "DEW vs. Scaffold."
2. **Shell** - the persistent chrome a role's screens share: primary icon rail + contextual
   sidebar (side nav), plus the header bar above it. Built from real components (step 1) and
   token-based structural chrome for the nav-specific parts per "Exploratory page layouts"'s
   nav-chrome exemption (now archived in
   context/archive/exploratory-layouts-history.md). As of the Sept 16 2026 layout decision, the sidebar shell is the one real
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
   main. The older shells (dashboard, project-list, project-detail, observation-detail, observations) still each own their
   column-2 and main content, but their header, rail, icon map and footer links are now the shared `AppHeader`,
   `PrimaryRail`, `sectionIcons` and `SidebarFooterLinks` (see the "Final check" contract above).

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
  below, the public-user bullet, now archived in context/archive/exploratory-layouts-history.md) rather than fabricating a filtered subset with no real leveled data behind it. **Revisit
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

- **Bulk sensitive species nomination (several species in one submission).** Per the designer (Sept 28 2026), the MVP is one species per nomination, the unit the review panel decides on; the project flow's species restriction already allows several, so a bulk nomination is a natural later step. **Revisit if**: nominators ask to submit a group of related species together (for example every bird nesting at one site).

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
