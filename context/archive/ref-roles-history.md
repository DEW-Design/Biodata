# Archive: .claude/rules/ref-roles.md as it stood on 2026-09-29, before the rewrite

Not loaded into sessions. The whole file, verbatim, from before it was rewritten to current practice (context/decisions/2026-09-29-34). Parts of it were no longer true: it said the nav tree had no role branching (`navForRole` exists), gave example URLs on the removed `option-1` routes, and told the `useRoleHref` and org-pill fixes as incident histories. Read it for why, never for how.

<!-- Moved verbatim from CONTEXT.md on 2026-09-29, unchanged. Hand-maintained: edit in place. -->

# Reference: user roles and the role-access matrix

The six roles, what each sees, how the role is switched via the URL, and the role-access matrix. Rules live in CONTRACTS.md; this is the reasoning and the how-to behind them.

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

**Previewing a role: the Prototype tools bar (`app/_prototype-tools/`).** The role is a
dev control, not a BioData SA feature. It is the always-present "Viewing as" tool on the one Prototype
tools bar that every screen mounts as `<PrototypeTools />` (CONTRACTS 3.8). Picking a role rewrites the
URL's `userRole` param. If the picked role can't see the current page (a whole-page gate: DSA, DLA, User
Management, nominations, dataset upload; `wholePageGates` in `prototype-tools.tsx`), it goes to
`/pages/dashboard` for that role instead of stranding the preview on a restriction message. Role names on
the bar: BioData Admin, BioData User, Privileged Admin, Privileged User, Registered User, Public user
("Signed out"). The earlier floating role button (`RoleSwitcher`, a `FloatingMenuFab`) was deleted on
Sept 29 2026 when the bar shipped; do not rebuild a separate floating button for a preview control.

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
