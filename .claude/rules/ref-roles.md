---
paths:
  - "lib/user-role.ts"
  - "lib/use-user-role.ts"
  - "lib/use-feature-access.ts"
  - "lib/use-role-href.ts"
  - "config/role-access.config.ts"
  - "lib/registered-user-nav.ts"
  - "app/_prototype-tools/**"
  - "app/pages/_shared/app-header.tsx"
  - "app/pages/_shared/primary-rail.tsx"
  - "app/pages/_shared/guest-*.tsx"
---

<!-- Hand-maintained: edit in place, current practice only. Rewritten 2026-09-29; the full earlier text, with its incident histories, is in context/archive/ref-roles-history.md. -->

# Reference: user roles and the role-access matrix

The six roles, what each sees, how a role is chosen and previewed, and how a feature is gated. Rules live
in CONTRACTS.md (persona consistency §3.4, three columns §3.7); this is the how-to behind them.

## User roles

Six roles, highest to lowest privilege. The order of `USER_ROLES` in `lib/user-role.ts` is the hierarchy:

| Role | Who | Org pill | Nav (`navForRole`) |
| --- | --- | --- | --- |
| `biodata-admin` | DEW super-user, admins the platform. Passes every feature check. | DEW | `biodataAdminNav`: the registered tree plus User Management and DSA |
| `biodata-user` | DEW staff | DEW | `registeredUserNav` |
| `privileged-admin` | Admin of a partner organisation | ORG | `registeredUserNav` |
| `privileged-user` | Member of a partner organisation (Birds SA and the like) | ORG | `registeredUserNav` |
| `registered-user` | Signed in, no organisation | none | `registeredUserNav` |
| `public-user` | Not signed in ("Signed out"). The default role. | none | `publicUserNav`: Home, Projects, Explore |

- **DEW is an organisation, the one at the top.** That is why the `biodata-*` roles get the org pill too, and
  it says "DEW" (`orgLabelForRole`); the `privileged-*` roles have no single known org in this build, so
  theirs says "ORG". The pill is shown by `AppHeader` where `orgSwitcher` allows it.
- **public-user** has no account: the header shows Log in and Sign up instead of the profile menu, and there is
  no DLA, Nominate Sensitive Species, Reports or Template Finder section, not even as a hidden leaf. Home is
  the Flora and Fauna dashboard with the sign-up card. Column 2 is the one place that explains
  (`GuestAboutAside`, the §3.10 exception). Features reduce for this role; screens are never redesigned for it.
- **The type stays six.** Build for a role only when the designer asks. The designer's standing focus is
  `registered-user` and `public-user`; on direct request, `biodata-admin` also has DSA, User Management, DLA
  approval and nomination review. The `privileged-*` roles and `biodata-user` have matrix entries but no
  screens of their own.

## Choosing and previewing a role

- **The URL is the only source of truth:** `?userRole=<slug>`. `useUserRole()` (`lib/use-user-role.ts`)
  reads and validates it and falls back to `DEFAULT_USER_ROLE` (`public-user`). It uses `useSearchParams`, so
  the role-dependent part of a page renders inside `<Suspense>` or the static build fails (see
  `app/pages/template-finder/page.tsx`).
- **Every internal link keeps the role:** wrap each `/pages/**` target (`href`, `router.push`) in
  `useRoleHref()` (`lib/use-role-href.ts`), which appends `?userRole=` or `&userRole=`. A bare path silently
  drops the viewer back to `public-user`; this was once broken across every shell.
- **Previewing is a dev tool, not a feature:** the "Viewing as" tool on the Prototype tools bar
  (`app/_prototype-tools/`, §3.8) rewrites `userRole`. If the chosen role can't see the current page (a
  `wholePageGates` entry in `prototype-tools.tsx`), it goes to that role's Home instead of stopping on the
  restriction message. Role names on the bar: BioData Admin, BioData User, Privileged Admin, Privileged User,
  Registered User, Public user. There is no separate floating role button; don't build one.

## Role access matrix (`config/role-access.config.ts`)

Per-feature visibility is decided in one place: `roleAccessMatrix`, a `FeatureKey -> UserRole[]` map the
designer owns. It is data, separate from `design-system.config.ts` (which doc variant shows).

- **Build for `biodata-admin` first, then gate down.** `hasFeatureAccess` always passes `biodata-admin`; an
  entry lists which other roles also get the feature. A feature with no entry is visible to everyone.
- **Call site:** `useFeatureAccess(feature)` (`lib/use-feature-access.ts`), never an inline role check (§3.4).
  Same `<Suspense>` need as `useUserRole`.
- **Don't invent entries.** Add a key only when the designer says a feature is restricted, or when a decided
  IA already restricts it (as `templateFinder` implements "no Template Finder for public-user").
- **Two kinds of gate:**
  - **A control:** hide it (`orgSwitcher`, `metricCardCustomization` hides the dashboard card menu for all
    but `biodata-admin`, `dlaApproval`, `nominationReview`).
  - **A whole page:** keep the shell and put the restriction in main (§3.7), and add the route to
    `wholePageGates` (`dsaManagement`, `dlaAccess`, `userManagement`, `nominationAccess`, `datasetUpload`,
    `templateFinder`, `reports`).
- **Record access levels** live in one place, `app/pages/_shared/map-search/record-access.ts`: `biodata-admin`
  (`restrictedData`) sees Level 1 to 4 in full; other signed-in roles see restricted records with the location
  shown only as a block (see below) and can request a DLA; `public-user` sees Level 1 only.
- **A restricted record is a block, never a point or a circle** (`generalisedBlock` in `map-search/geo.ts`; size
  from `restrictedRadiusKm` in `search-data.ts`, the one place to change it). The map draws the square cell of the
  grid that contains it: flat, a thin edge, no centre mark, no blur. Tables, exports and the record page withhold
  the coordinates altogether (not rounded ones: any point in the block is a place to look). A search area matches
  the record when it overlaps the block (`isRecordInAnyBoundary`), never by testing the real point, or a small area
  could be moved about to find it. Copy says "a 5 km block", not "within about 5 km" (the real position is within
  half a block of the centre, closer than that wording claims). Every screen that shows a record asks
  there.
