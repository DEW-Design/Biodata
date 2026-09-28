# 2026-09-22 - Data Sharing Agreement (DSA) workflow for `biodata-admin`, at `/pages/dsa`.

- **Sept 22 2026: Data Sharing Agreement (DSA) workflow for `biodata-admin`, at `/pages/dsa`.** Source: the Master
  Flows lo-fi (Figma `yzQY87GXoyGGGPJDnh1hmi`, node `3:15901`: DSA List, DSA Empty State, DSA Record form). The lo-fi is a
  starting point; its content is fitted into the shell, none of its own header or two-pane chrome is reproduced.
  - **Fit into the shell, and the list -> deep dive structure (revised the same day, per the user).** The first pass put the
    agreement list in column 2 and the record in main on one page. Reworked to follow Projects: `/pages/dsa` is a table
    (`DsaListContent`: Agreement, Data partner, Agreement period, Requested by, Shared via, Updated; rows link out), column 2 is
    the four status buckets as links with counts, a row opens `/pages/dsa/<id>` (the deep dive), and the form lives at
    `/pages/dsa/new` and `/pages/dsa/<id>/edit`. Pattern documented in "List -> deep dive" above. The lo-fi's own header and
    two-pane chrome are still not reproduced. Column 2 (status buckets) also appears in the mobile menu below `lg`.
  - **Nav:** `biodataAdminNav` in `lib/registered-user-nav.ts` is the registered-user tree with the DLA section given its
    admin items (Approve Reject DLA Requests, Withdraw DLA) and a keyed "Data Sharing Agreement (DSA)" leaf added straight
    after it; `navForRole(role)` picks the tree and the five sidebar shells (dashboard, project-list, project-detail,
    observation-detail, observations) call it instead of the inline public/registered ternary. `key: "dsa"` -> `/pages/dsa`
    through the existing `keyHref`/`goToSection`, so no per-shell routing was added. DSA's rail icon is `FileCheck02`, DLA keeps
    `FileLock01`. Gated by the `dsaManagement` feature (`[]`, admin only); a direct visit by any other role shows an honest
    "managed by BioData Admins" state. Every non-admin nav is unchanged.
  - **Correction, same day:** the first pass swapped DLA out for DSA in the admin tree, treating them as one renamed concept.
    That was wrong - the admin IA screenshot (see the cross-check entry below) keeps DLA as its own module and the review
    comments list DSA as an additional one. DLA is restored; DSA is a separate section.
  - **Deep dive** follows the lo-fi's three cards (Agreement overview, Agreement contacts, Data sharing methods) but renders
    read-only facts as label/value pairs, not grey input-looking boxes, and shows "Not provided" for empty values. The API
    systems table is a real `Table`; its "View details" opens a `SidePanel` with scope, permissions, the organisation contact
    and credentials (masked until "Show tokens"). Actions menu: Edit / Revoke (Draft: Edit draft / Delete draft, Revoked: none),
    each destructive one behind a `DestructiveModal`. **Download PDF is a toast**, not a download: no PDFs are stored in this build.
  - **Deep dive opens with the same gradient card as Home/project-detail (same day, per direct request: "the metadata sort
    of sits in there").** A plain toolbar (Back to agreements, Download PDF, Actions) sits above it - action buttons stay off
    the gradient, same "the banner doesn't carry action buttons" precedent as the Home dashboard's own copy of this card - then
    the card itself carries the agreement's identity (`DATA SHARING AGREEMENT` label, the ID as an H1) and its short-form
    metadata (Data Partnership, Valid From, Valid To, Status) as `MetaField`s, `onDark`. The Agreement Overview card below
    dropped those same four fields - it now holds only Purpose of Data Sharing and the signed file, the two that don't fit a
    compact metadata row - so nothing is stated in two treatments. Agreement Contacts and Data Sharing Methods are unchanged;
    the gradient card is the glanceable identity, not a replacement for the full contact details. Verified live on both an
    Active agreement and a Draft with unset dates/contacts (`Not provided` on `white/70` still reads clearly on the dark
    gradient) - `tsc`/`eslint` clean, zero console errors, Edit/Revoke still work unchanged.
  - **Correction, same day: the deep dive's own information arrangement rebuilt to borrow project-detail's structure
    directly, per direct follow-up feedback** ("the structure of arranging information should also be borrowed from the
    project details screen. Currently the DSA information screen looks like it's all over the place"). The gradient-card pass
    above still stood, but everything below it was 3 same-weight `BentoCard`s stacked flat, each re-announcing its own icon
    +title (redundant once the gradient card already states the identity), and Agreement Contacts crammed both contacts into
    one shared card's grid rather than giving each its own boundary - the actual "all over the place" complaint, not any one
    card's content. Replaced with a real `Tabs`/`TabList`/`TabPanel` row directly under the gradient card, `type="underline"
    size="md"`, the exact treatment project-detail's own `ContentTabs` uses (no extra wrapper - `TabList` draws its own
    underline): **Overview** (Purpose of data sharing, the signed file, then Agreement requested by / Agreement custodian as
    two separate `BentoCard`s side by side - the same per-contact-card fix project-detail's own `ContactCard` already applies,
    renamed from `ContactPanel` to `ContactCard` to match) and **Data Sharing** (the offline/system methods plus the API
    systems table, unchanged). No tab panel repeats its own tab's label as a card header - the tab already says where you are.
    Verified live: both tabs switch correctly, the system detail `SidePanel` still opens from the Data Sharing tab, the two
    contacts render as visually distinct cards - `tsc`/`eslint` clean, zero console errors.
  - **Second correction, same day: the rigour and polish from project-detail ported directly, per a screenshot of that
    exact screen** ("the rigour and polish from projects needs to flow through to these screens as well"). The prior
    round fixed the *tiering* (tabs instead of a flat card stack) but the tab content itself was still plainer than
    project-detail's own Overview: loose `Field` rows with no card boundary, and `ContactCard` was an approximation
    (name/email/phone as three bare lines, no icons, no org context) rather than a direct port of the real component.
    Now ported exactly, not re-derived:
    - **Overview and Data Sharing each render as one bordered card** (`rounded-lg border border-secondary`), its own
      fields divided by `border-b` - a baseline label-left/value-right row for a short fact (Signed agreement, Data
      shared via offline - project-detail's "Full Project Name" row) and an uppercase eyebrow-label section for a
      longer one (Purpose of data sharing, Data shared via system - project-detail's "Abstract"/"Geographic scope").
      Purpose does not get project-detail's `line-clamp-3`/"Read more" treatment - DSA's purpose text is short enough
      that it would be a "Read more" button that never has more to show, a fake affordance, not a real port.
    - **Overview's contacts moved from a same-width grid into a persistent right rail** (`lg:w-80 lg:shrink-0`, main
      content `flex-1`), matching project-detail's Data Owner/Project Manager rail exactly rather than two cards
      competing for the same width as the main content.
    - **`ContactCard` rebuilt to project-detail's real component**, not approximated: an optional `orgLabel` under the
      title (passed as `dsa.partner` for "Agreement requested by" - real, distinct information; omitted for "Agreement
      custodian (DEW)", since its org is already named in the title and repeating "DEW" a line below would be a literal
      duplicate, not the accepted-duplication case), then a `border-t` divider, the contact's name, and a real
      `Mail01`/`Phone01`-led row instead of two bare text lines.
    - **Deliberately not ported**: project-detail's `FlaggedConceptsBanner` (an admin review queue over a project's own
      flagged concepts). DSA's data model has nothing real to flag on an agreement yet, so no banner was faked here
      just to visually match - "rigour" means porting real structure, not inventing a feature to look busier.
    - The list page (`dsa-list.tsx`) was checked against `project-list-content.tsx` and already matches its pattern
      (`SectionHeader`, `TableCard`, numbered pagination, linked rows) - its one addition, a local per-bucket search
      box, is justified (the global header search is projects-only) and not a gap to fix.
    Verified live on both an Active agreement (all fields populated) and a Draft (partner/purpose/file/custodian all
    empty) - "Not provided" rows and the custodian's icon-less empty state both render cleanly, `tsc`/`eslint` clean,
    zero console errors.
  - **Form** is tiered, not one flat scroll (the lo-fi has ~8 field groups plus a repeatable system block): tabs Agreement /
    Contacts / Data sharing, error counts on each tab after a failed submit, a footer count, a sticky Back / Save draft / Submit
    bar, a discard guard on Back, and each API system as its own boxed `Accordion` item (only present once "System" is
    ticked, as in the lo-fi). Tokens are masked by default; "Re-generate tokens" is confirmed because it invalidates the old ones.
    Tokens are random JWT-shaped placeholders, never real credentials. Draft needs only the organisation; Submit validates the rest.
  - **State is a module store** (`dsa-store.ts`), seeded from `dsa-data.ts`; create, edit, revoke, draft and delete all work
    across routes for the session and vanish on reload (a deep dive for an agreement created this session then shows "not found"). Status is stored, not derived from dates (see open questions).
  - **Gaps, both unresolved:** (1) **"Purpose of Data Sharing" is a `?` marker**: it needs a multi-line field and DEW has no
    Textarea (the same gap `/test-site-details` logs). It is not validated, so new agreements save with no purpose until a
    Textarea is ingested. (2) **"Upload Agreement" uses the real `InputFile`** (button + file name, PDF only, 5 MB) in place of
    the lo-fi's drag-and-drop zone; same job and accepted types, different affordance. The lo-fi's concentric-ring empty-state
    backdrop is a decorative graphic with no asset here and is left out.
  - **Open questions for the business, none decided here:** (a) **DLA vs DSA, resolved:** two separate modules (see the
    correction above). The lo-fi's empty-state body still says "Data Licensing Agreement", which reads as a lo-fi copy slip.
    (b) **What "Inactive" means** and whether anything moves an agreement between buckets automatically (expiry?).
    Only Save draft, Submit and Revoke transition status. (c) **Is there an approval step?** The lo-fi's empty-state copy
    ("seek approval... track the status of your request") describes a requester waiting on a decision, but no Pending status is
    drawn; an admin's Submit makes an agreement Active. The requester-facing flow is a different persona and is not built.
    (d) **Permissions per scope or per system?** The lo-fi shows one Read/Write pair under the scope select; built once per system.
    (e) The lo-fi list's filter icon beside search has no defined behaviour and is omitted.
  - **Shell note:** the shell is one shared component, `DsaShell`, used by all four DSA routes. `ProfileMenu` and
    `GuestAuthActions` were extracted to `app/pages/_shared/profile-menu.tsx`; the five older shells still carry their own
    identical copies (separate cleanup). The form
    footer clears the `RoleSwitcher` FAB (`pr-20`), which otherwise sits on top of Submit.
  - Verified: `tsc` and `eslint` clean on every touched file; live Playwright pass over list, detail, system panel, all four
    empty states, create (empty submit, per-tab errors, bad email, wrong file type, system + scope + permissions, token
    show/re-generate, submit), edit of a live agreement and of a draft, revoke, delete draft, search, all 6 roles, rail
    navigation from three other shells with the role preserved, and an 800px viewport; zero console errors.