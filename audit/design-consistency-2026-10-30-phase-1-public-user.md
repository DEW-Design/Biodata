# Design consistency sweep, phase 1: the public user (signed out), 30 Oct 2026

Question asked: for every page a public user can reach, what is inconsistent with the design system, what needs to be fixed, and what is the fix; and which behaviours do not match.

**Phases 2 (registered user), 3 (BioData super admin) and 4 (BioData admin) have not been run.** Nothing in the app was changed by this sweep. Nothing is committed.

**Answer in one paragraph.** The product screens a public user lives in are in good shape visually: 37 pages loaded with **zero console errors and zero failed requests**, every product text is Barlow on the type scale (on the product screens the one off-scale size is the header wordmark; the marketing pages have more, P1-25), every text colour is a Figma colour, and the shell geometry is identical (header 1600 x 64, main at x 350 with column 2 and x 64 without, on every shell page). The gaps are in four places: (1) **what a signed-out visitor is allowed to see** (a Draft project, reviewer notes with a gate-key note, the people and their access levels), (2) **how a restriction is shown and what it offers** (three patterns, and the page-level one has no way to sign up), (3) **the auth flow and the marketing pages**, which sit outside the shell and drifted on brand name, case, headings and validation, and (4) a handful of single-component misses (a 17px wordmark, blue and red used as categories, a link outside its card, controls with no focus ring).

## Decisions received, 30 Oct 2026 (after the sweep)

| # | Decision | Status |
| --- | --- | --- |
| 1 | Published only: a signed-out visitor sees Active and Completed projects. | **Done** (P1-01) |
| 2 | Flags and field notes: members and reviewers only. | **Done** (P1-02), see the correction under it |
| 3 | Project access tab: the designer asked for a screenshot first. | **Waiting** (`.context/audit/phase-1-public/decisions/03-project-access.png`) |
| 4 | Colours not in the Figma set: the designer asked for a screenshot first. | **Waiting** (`.context/audit/phase-1-public/decisions/04-colours.png`) |
| 5 | The header wordmark: the designer believes 17px; double-check. | **17px stays** (P1-08): no Figma frame in the linked files draws this header, so the designer's word is the source |
| 6 | Marketing home: do not touch. | **Closed**: P1-25 and the marketing parts of P1-09 and P1-16 are not to be changed |
| 7 | Stacked rows are 40px, not exempt. | **Done** (P1-22) |
| 8 | The Data ingestion stress test: registered users and above. | **Done** (P1-21) |

The other findings (P1-04 to P1-07, P1-09 to P1-20 outside the marketing pages, P1-23, P1-24, P1-26) have not been approved to fix and are unchanged.

Evidence is kept in `.context/audit/phase-1-public/` (gitignored): `shots/` 46 screenshots, `data/` the measurements per page and the scripts that produced them.

## How to read this file

- Each finding has: **Where**, **What is wrong**, **What needs fixing**, **The fix**. Type is Visual, Behaviour, A11y, Copy or Structure.
- Severity: **HIGH** = wrong for a signed-out visitor, or a behaviour that contradicts the role model. **MED** = visible on a second look, or one shared fix removes many sites. **LOW** = polish or a decision to record.
- "Needs a decision" means the contracts are silent and the agent does not decide it (CONTRACTS 0.4). Those findings state a recommendation and wait.
- Clause references are to CONTRACTS.md. "Known" means the 6 Oct audit or a decision already names it; those are listed once at the end and not re-raised.

## 1. What ran

| Step | Result |
| --- | --- |
| `npx tsc --noEmit` | clean |
| `npm run check:contracts` | **OK**. Every finding below is REVIEW-only or a gap in an AUTO check. |
| `npx eslint app components lib config --max-warnings=0` | fails: **27 errors, 9 warnings, none in a public page.** They are in the Untitled UI ingest files (`input-tags.tsx`, `input-tags-outer.tsx`, `tag-select.tsx`, `tags.tsx`) and `lib/config-context.tsx:57` (a `setState` in an effect). The same files as on 6 Oct. |
| Colour primitives against `contracts/figma-colours.json` | not re-pulled from Figma; the recorded reference is unchanged and `check:contracts` (2.1c) passes, so **no primitive drifted and nothing was fixed on sight**. |
| Live sweep, Playwright, 1600 x 1000, scrollbars drawn | **37 pages** as `?userRole=public-user`: Home; Projects; the project page (Overview, Project records, Species, Datasets URL, Artefacts, Project access); Explore; the observation page; the 10 auth pages; both marketing pages; 16 pages a public user can reach by URL and that are gated (DLA, DLA new, DSA, Nominations, Nominations new, Template Finder, Reports, User Management, Controlled Vocabulary, Taxonomy, Notifications, Vouchers, Upload dataset, Add project, Flagged concepts, Data ingestion stress test). |
| What was measured on each page | console errors and failed requests; document title and headings and landmarks; every visible text's family, size, weight, line height, tracking, case and colour (against the type scale and the Figma colour set); every background and border colour; every control's accessible name and 40px target (probed by `elementFromPoint` just inside the target); images without alt; copy scan (em dash, middle dot, arrows, three dots, stray dash, undefined); 14 Tab stops and whether each draws a focus ring; shell geometry; horizontal overflow. |
| Behaviour probes | the Projects column 2 actions; the project's Upload and "..." menus; the project switcher; field notes; the header search; Home's CTA and tabs and KPI tile; Explore's search, export and banner; the empty submit of five auth forms; whether a Draft project opens; what every gated page says and offers. |
| Independent checks of my own findings | the 14px/700 table-header reading was a false alarm (the `th` element's default; the text is 12px/600 as `Table.Head`) and is not a finding; the `styles-module__` controls and `system-ui` text on every page are the Agentation feedback overlay, not the product, and were excluded. |

**Not covered, said plainly.** Mobile and tablet widths; dark surfaces; the sign-up and login happy paths past the form (no backend); screen reader output (names and structure were read from the DOM, not heard); the record side panel and full record page of a project (covered in phase 2, where records are editable); touch (the 40px probe is a mouse probe); the `/pages` screen index, `/proto` and the Prototype tools bar (out of scope, as on 6 Oct).

## 2. What already holds (one line each)

- **Zero console errors and zero failed requests** on 37 pages; no horizontal overflow on any.
- **One typeface:** all product text is Barlow (Fredoka only on the marketing v2 wordmark, the allowed exception, 2.2). 56 type combinations in use across the whole sweep.
- **Every product text colour is in the Figma set;** the only off-Figma text colours are the blue chip (P1-10) and one marketing teal (`#b3dbdb`, v2).
- **Shell:** header 1600 x 64 on all 26 shell pages; main is x 350 (column 2 present, 19 pages) or x 64 (a record page or Explore, 7 pages), as 3.7 says. Header and rail are the same on every page, and the Tab order is the same: header, then rail, then content.
- **The gate for an action is one pattern:** Export CSV, Create report, Upload dataset, Upload attachments, Explore's Export data and Home's "Create a free account" all open the same sign-up dialog with Log in and Sign up. (This is the pattern the page-level gates should copy: P1-06.)
- **Restriction pages are three-column,** with the section name in column 2 and the explanation in main (3.7, 3.10).
- **The public user has no edit icons, no Add restriction, no Datasets tab and no Add menu;** the hero's actions are Upload and "...", each gated by the dialog.
- **Table headers** are one treatment (`Table.Head`, 12px/600, quaternary) on the Projects list, Project access, the record panel's coordinate table.
- **Scientific name italic on the Species tab and Explore's results** follows 2.15 (each is the source of its own list).

## 3. Findings

### HIGH

**P1-01. A signed-out visitor sees, and can open, a Draft and an Under review project.** Behaviour. Needs a decision.
- **Where:** `app/pages/_shared/project-list-data.ts` (4 projects, no status filter), the Projects list, the project switcher in the breadcrumb, and `/pages/project-list/flinders/project-details`.
- **What is wrong:** the Projects list as Public User shows "Flinders Ranges Reptile Atlas" with status DRAFT and the line "Draft submission, not yet published", and "Coorong Wetlands Bird Count" UNDER REVIEW. The breadcrumb switcher lists the same four. Clicking the Draft row opens its project page (status DRAFT in the header). A draft is private to its creator in every other part of the model (the creator's "My projects", the review flow); Explore for the same user says "Sensitive records are not shown".
- **What needs fixing:** a public user's list, switcher, search and project pages show published projects only.
- **The fix (done, 30 Oct 2026; the designer: "published only"):** `isProjectVisibleTo` and `PUBLISHED_PROJECT_STATUSES` (Active, Completed) in `project-list-data.ts`, applied in `useAllProjects()` (the list and the switcher), the header search, and the project route, where a hidden project shows "This project isn't available". The original recommendation was: filter by status for `public-user` where the list's data is read (the list and the breadcrumb switcher both show the Draft; the header search was not opened on it, check it too) to `Active` and `Completed`, and make a draft's route show the same "This project isn't available" state that a wrong id shows. Recommendation only: if Under review is meant to be public, keep it and filter Draft alone.

**P1-02. Reviewer working data is readable by a signed-out visitor: flags and field notes.** Behaviour. Needs a decision.
- **Where:** Project records (`?tab=records`): the "1 flagged concept" markers in the tree, and the "show notes" button on a field ("Description: show notes").
- **What is wrong:** as Public User, the records tree draws a flag count (orange flag, "1 flagged concept") on several rows, and a field's "show notes" button opens its comment (for example, on Site grouping: "Grouped with the other fire-recovery sites so they report together.", Maya Dewitt, 3 Nov 2025). A flagged concept is a reviewer's questionable mark on a record; a note is a team member's working comment. Neither is shown anywhere else to a signed-out visitor. **Correction (30 Oct 2026):** this finding first quoted "Access via the Waterfall Gully fire track; gate key held by Cleland ranger station." as a note. It is not: it is the record's own "Specific property details" field value, which is public record data and is on the page before any note is opened. It was read from the page text and attributed to the note without checking; it is not part of this finding.
- **What needs fixing:** notes and flags are for the project's people and reviewers.
- **The fix (done, 30 Oct 2026):** a `fieldNotes` feature in `config/role-access.config.ts` (every signed-in role; not `public-user`), read once in `useFieldNotes()` (`field-notes-store.ts`), which gives a role without it the files attached to a field and nothing else. The files stay because they are the project's artefacts, which the Artefacts tab lists to everyone; so a public record still has a "show notes" button on the two fields that have a file (Description, Photopoint disc number), opening the file and no comment, and no flag marker anywhere.

**P1-03. The Project access tab shows a signed-out visitor who has what access.** Behaviour. Needs a decision.
- **Where:** `?tab=access`, `project-access-view.tsx`.
- **What is wrong:** the tab lists "People on this project" with each person's email address and their access ("Full control", "View only"), under a banner "Only a Project Manager or a BioData Admin can change access". The same people's names, emails and phone numbers are on the Overview (so the email itself is not new), but who holds Full control is permission data.
- **What needs fixing:** decide whether the tab exists for a signed-out visitor.
- **The fix:** remove the tab for `public-user` (as the Datasets tab is), or keep it and drop the Access column. Recommendation: remove it.

### MED

**P1-04. Every page has the same document title.** A11y, Behaviour.
- **Where:** `app/layout.tsx:38` (`title: "DEW Design System"`); 37 of 37 pages.
- **What is wrong:** a tab, a bookmark, history and a screen reader announcement say "DEW Design System" for Home, a project, a login form and a restriction.
- **What needs fixing:** a title that names the page, and the product, not the design system.
- **The fix:** `title: { template: "%s | BioData SA", default: "BioData SA" }` in `app/layout.tsx`, and a `metadata.title` in a server `layout.tsx` per section (Home, Projects, Explore, Auth), since the pages are client components; for the dynamic project page set it from the record in a small `usePageTitle` hook. WCAG 2.4.2.

**P1-05. Heading and landmark structure is not one pattern.** Structure, A11y.
- **Where:** `components/application/section-headers/section-headers.tsx:30` (always an `h2`); `app/pages/auth/_shared/auth-shell.tsx`, `auth/setup-profile/page.tsx:103`, the other 9 auth pages; `biodata-home/version-2/page.tsx`.
- **What is wrong:** the page title is an `h1` on a project, Home, the observation page and every gated page, but an `h2` on **Projects** ("All projects") and **Explore** ("Search the map"), so those two pages have no `h1`. All 10 auth pages have no `h1` and **no `<main>`**: the title ("Sign in to your account", "Account Created!") is a `<p>`. The marketing v2 page has no `h1` and no `<main>`.
- **What needs fixing:** every page has one `h1` and one `main`.
- **The fix:** give `SectionHeader.Heading` an opt-in `as="h1"` (1.6, default unchanged) and set it on the list pages and Explore's card; in `auth-shell.tsx` render the title as an `h1` and wrap the card in `<main>`; add `<main>` and an `h1` to marketing v2.

**P1-06. Three ways to say "you need an account", and the page-level one offers no way to get one.** Behaviour, Structure.
- **Where:** five shells each draw their own copy of the page-level state (read in source): `dla/dla-shell.tsx:124`, `dataset-upload/upload-shell.tsx:65`, `nominations/nomination-shell.tsx:130`, `template-finder/template-finder-shell.tsx:65`, `reports/reports-shell.tsx:72`; the admin pages and `flagged-concepts/page.tsx` carry their own as well; against `project-registration` (`registration-flow.tsx`) and `guest-action-gate.tsx` (`SignUpPromptModal`).
- **What is wrong:** 7 gated pages (DLA and DLA new, Nominations and Nominations new, Template Finder, Reports, Upload dataset) say "needs a free BioData SA account. Create one to ..." and offer only "Go to Home" (or "Go to the project"); 7 more (DSA, User Management, Controlled Vocabulary, Taxonomy, Notifications, Vouchers, Flagged concepts) say "managed by BioData Admins" and offer the same. There is no Log in or Sign up button on any of them (the header has them). The Add project gate has Log in, Sign up and "Back to projects". An action gate (Export CSV, Upload ...) opens a dialog with Log in and Sign up. The copy promises an action the page does not offer.
- **What needs fixing:** one restricted-state component, and the same way forward everywhere.
- **The fix:** extract `RestrictedState` (heading, one line, then **Log in** and **Sign up** for a signed-out visitor, "Go to Home" as the quiet third) into `app/pages/_shared`, use it in the shells and pages above, and have `SignUpPromptModal` and it share their copy and buttons. One component, so a new gated page cannot drift (0.8).

**P1-07. An admin-only page tells a visitor with no account "Your account doesn't have access".** Copy, Behaviour.
- **Where:** DSA, User Management, Taxonomy, Notifications, Controlled Vocabulary, Vouchers ("this section"), Flagged concepts ("this page").
- **What is wrong:** a signed-out visitor has no account. "Managed by BioData Admins. Your account doesn't have access to this section." reads as an error about something they do not have, with no way forward. "section" and "page" differ between pages.
- **What needs fixing:** copy for a signed-out visitor, one noun.
- **The fix:** inside the shared `RestrictedState` (P1-06), for `public-user` on an admin page: "Managed by BioData Admins. Log in with an admin account to open it." with Log in as the action; keep "Your account doesn't have access to this section" for a signed-in role that lacks the feature. One noun: "section".

**P1-08. The header wordmark is 17px, a size no scale has.** Visual, Type. **Settled 30 Oct 2026: 17px stays.**
- **Where:** `app/pages/_shared/app-header.tsx:62` (`text-[17px] font-semibold tracking-tight`), and `biodata-home/version-2/page.tsx:525`; 27 of 37 pages.
- **What is wrong:** the type scale is 12, 14, 16, 18, 20, 24, 30, 36. 17px (25.5px line, -0.425px tracking) is a layer no source defines (2.9).
- **What needs fixing:** a size from the scale, or the Figma node that draws 17.
- **The fix:** re-fetch the header's Figma node (2.5). If it draws 17, add it to the scale with the designer's say-so; otherwise `text-lg` (18px) with the same weight. **Result:** the designer believes it is 17 and asked for a double check. No Figma frame in the files this repo links draws the app header: the "BioData SA High Fidelity" file's Public User page draws a left sidebar, the marketing file's header is the DEW agency header (logo, Search, About us) with no "BioData SA" text, and the landing page file's linked node is an empty frame. The code's own comment and `2026-09-25-20` record 17px semibold as deliberate (it sits on the breadcrumb's baseline). So 17px stays, the designer's word is its source (2.9), and a comment in `app-header.tsx` says so.

**P1-09. The product's name is spelled three ways.** Copy.
- **Where:** `auth/_shared/auth-shell.tsx:22` ("Biodata SA", 30px bold teal), `auth/account-created/page.tsx:20` ("access Biodata SA"), the marketing navigation ("What is Biodata"), against "BioData SA" in the header, the page copy, the document and the restriction pages.
- **What is wrong:** one name, 3 spellings, and two treatments (header 17/600 dark, auth 30/700 teal).
- **What needs fixing:** one spelling and one wordmark treatment per surface.
- **The fix:** "BioData SA" everywhere (a `PRODUCT_NAME` constant would stop it returning, as `DLA_SECTION_LABEL` does for DLA); the nav label becomes "What is BioData SA"; the auth wordmark keeps its own size if the designer wants a larger lock-up on a card-less screen, but in the same weight and colour as the header.

**P1-10. Colours that match nothing in the Figma set.** Visual, Colour (2.1).
- **Where:** (a) `project-list-data.ts:71` (`statusColor: "blue"`, Completed), `artefacts-view.tsx:300` (VIDEO), `nomination-protection.tsx:176`; `#175cd3` on `#eff8ff`. (b) `_shared/data-overview.tsx`: Home's pie and legend (`#0ba5ec`, `#7a5af8`, `#ef6820`, `#ee46bc`, `#4e5ba6`). (c) marketing v2: `bg-[#f5f5f5]`, `#b3dbdb`, `#414651`.
- **What is wrong:** `blue` is Untitled UI's, not in `contracts/figma-colours.json` (Figma documents Horizon Blue but it is not ingested). The chart colours and the marketing hexes are literals. `check:contracts` passes because 2.1d is a ratchet.
- **What needs fixing:** each colour traces to Figma, or is a decision.
- **The fix:** needs a decision. Recommendation: Completed takes the success or gray badge (a completed project is not a fourth status colour); the chart's categorical colours come from Figma's categorical set or the dataviz palette validated for colour-blind separation (the 9 species groups need 9 separable hues); the marketing hexes become tokens. Ingesting Horizon Blue is a designer act (9.4).

**P1-11. File-type chips use the error and success colours as categories.** Visual.
- **Where:** `project-detail/artefacts-view.tsx:300` (`meta.badgeColor`): PDF is red, SPREADSHEET green, IMAGE gray, VIDEO blue.
- **What is wrong:** red and green mean error and success everywhere else (status, alerts). A PDF is not an error. The icon above and the label say the type already.
- **What needs fixing:** a category is not a status colour (2.12: nothing without a purpose).
- **The fix:** every file-type chip gray; keep the type word.

**P1-12. "Go to record" is in the card on Species and under the card on Artefacts.** Visual.
- **Where:** `species-view.tsx:126` (inside the card, its last row) against `artefacts-view.tsx:247` and `:329` (below the card's border).
- **What is wrong:** the same action, the same link style, two positions, on two tabs of one page.
- **What needs fixing:** bring the screen being touched in line with the sibling (0.9 item 4).
- **The fix:** put Artefacts' link inside the card, as the last row, like Species.

**P1-13. Empty submit on Login, Sign up and Forgot password shows only a red border.** Behaviour, A11y.
- **Where:** `auth/login`, `auth/signup`, `auth/forgot-password`.
- **What is wrong:** submit with nothing entered turns the fields' borders red and says nothing: no message, no icon. Colour is the only signal. Meanwhile Reset password and Set password disable the button until the password rules pass, and Setup profile disables Continue: two validation behaviours in one flow, neither the form pattern (4.1 item 4: the missing thing is named, inline).
- **What needs fixing:** one validation pattern.
- **The fix:** keep the button enabled everywhere; on submit, show the `Input`'s own hint under each invalid field ("Enter your email address") with its error icon (the component already supports `hint` and `isInvalid`); keep the rules list on the password pages as live hints.

**P1-14. Controls with no visible keyboard focus.** A11y (1.9 item 4).
- **Where:** the password show and hide toggle (`Toggle password visibility`) on Login, Reset password (both fields) and Set password; the Dismiss button of Explore's "You're viewing public data" banner (`page-banner.tsx`).
- **What is wrong:** Tab lands on them and nothing changes on screen (no outline, no shadow, 4 stops measured). Every other Tab stop in the shell draws the focus ring.
- **What needs fixing:** the ring, at the component, once.
- **The fix:** `outline-focus-ring focus-visible:outline-2` on the password toggle in `components/base/input` and on `PageBanner`'s close control, as `Button` has.

**P1-15. An unnamed icon button.** A11y.
- **Where:** `auth/setup-profile/page.tsx:138`, the "?" inside Display Name / Alias (it has a tooltip, no accessible name; 16 x 16).
- **What needs fixing:** a name.
- **The fix:** `aria-label="What is a display name?"` (or the field's help text), and a 40px target (`hit-area`).

**P1-16. Title Case, a verb as a noun, and "Sign in" against "Log in".** Copy.
- **Where:** `setup-profile/page.tsx:103,129-141`: "Setup your Profile", "First Name", "Last Name", "Display Name / Alias", "Contact No.", "Privacy & Terms of Use"; the login page's "Forgot Password" link and "Forgot Password?" title; the marketing navigation and calls to action ("Resources & User Guides", "Contact Us", "Learn More", "Start Exploring", "Contribute Now").
- **What is wrong:** the app is sentence case ("Your details", "Organisation details", "Profile picture", "Project managers"). "Setup" is a noun; the verb is "Set up". The header says "Log in" and the page it opens says "Sign in to your account" with a "Sign in" button, and links "Sign in" from Sign up.
- **What needs fixing:** sentence case, one verb.
- **The fix:** "Set up your profile", "First name", "Last name", "Display name or alias", "Contact number", "Privacy and terms of use", "Forgot password?"; marketing labels likewise. Pick "Log in" (the header's, and the contract's `LogIn01` entry names it first) and use it on the page title, the button and the cross-links.

**P1-17. The Project access search is 320px wide.** Visual (4.2c).
- **Where:** `project-detail/project-access-view.tsx:96-102` (a table header's own `search`), against `ToolbarSearch` (384px) on Project records, Species, Artefacts and every list.
- **What needs fixing:** one toolbar search width. The AUTO check only sees toolbars that have a Filter button, so it missed this one.
- **The fix:** `ToolbarSearch` in that header, or extend the 4.2c check to any `SectionHeader` or table header with a search input.

**P1-18. Add project's column 2 explains.** Structure (3.10).
- **Where:** `project-registration/option-2/registration-flow.tsx:175`: "Adding a project needs a BioData SA account. Once you have one, each section of the form is listed here."
- **What is wrong:** column 2 holds information; the public-user exception is `GuestAboutAside` only. The same sentence is already in main. Its title ("Sign up to add a project") is also the one gate that does not carry the section's name as its heading.
- **What needs fixing:** column 2 is a label.
- **The fix:** remove the paragraph; column 2 reads "ADD PROJECT" alone, as the other gates' do; use the shared `RestrictedState` (P1-06).

**P1-19. Explore draws "all of South Australia" as a 1000 km circle, and opens on the wrong view.** Behaviour, Visual.
- **Where:** `_shared/map-search/geo.ts:120` (the whole-state area is `kind: "circle", center: [-32, 135], radiusKm: 1000`); the initial extent of the Explore map.
- **What is wrong:** the card says "Search all of South Australia" and, once a search runs, the map draws a circle that covers Western Australia, the Northern Territory, Queensland, New South Wales and Victoria. The first view (before any search) is the south-east of the continent with South Australia's west cut off behind the card.
- **What needs fixing:** the area drawn is the area searched, and the first view frames the state.
- **The fix:** give the whole-state area South Australia's outline as a polygon, so the area drawn is the area named, and fit the first view to its bounds with the card's width as left padding (the map already takes `fitPaddingTopLeft`). Which of the two the search itself uses was not traced.

**P1-20. The observation page is the old record page.** Structure (3.7, 4.6).
- **Where:** `/pages/observation-detail`; reached from the Pages map and the screen index, not from Explore or the project.
- **What is wrong:** it keeps column 2 (a records tree), has no `RecordHero` (a plain title), no tabs (accordion sections with a `+` that are **all closed**, so the page shows no content), a breadcrumb that collapses to "..." (a 19 x 20 button), and a field with a stray "-" for a missing value ("Description"), which 2.3 forbids ("Not provided").
- **What needs fixing:** retire it for the project record page, which does follow 4.6, or bring it in line.
- **The fix:** remove the route and its Pages entry once nothing links it, and send `project-record-tree.ts`'s example links to `project-details/[kind]/[recordId]`.

### LOW

**P1-21. The Data ingestion stress test is open to a signed-out visitor.** Behaviour. **Done 30 Oct 2026: registered users and above.**
- **Where:** `/pages/data-ingestion-stress-test` (no gate; "Choose file(s)", "Load sample data"). Made a page so reviewers see it in production (`9ceb1e7`).
- **What is wrong:** an engineering tool with an upload control is reachable by a visitor, by URL, as the page sits under the production site. It is not in anyone's navigation.
- **The fix (done):** an `ingestionStressTest` feature (every signed-in role), a `wholePageGates` entry, and the shell shows the restriction in main for a signed-out visitor through a new shared `RestrictedState` (`app/pages/_shared/restricted-state.tsx`: the heading, one line, Log in and Sign up, and Go to Home). It is the first user of it; the other shells move to it only when P1-06 is approved.

**P1-22. "On this page", the tree toggles and the crumb overflow are under 40px.** A11y (2.16). **Done 30 Oct 2026: rows are 40px, not exempt.**
- **Where:** `project-tab.tsx:443` (the links are `py-1.5`: 28 and 32px tall, 224 wide, on Overview and Datasets); the records tree's Collapse and Expand (16 x 16); the crumb's "5 more levels" (19 x 20).
- **What is wrong:** a mouse target under 40px with no extension. The links are stacked rows (the contract exempts the extension for stacked rows, not the height).
- **The fix (done):** the "On this page" links are `min-h-10` (40px rows, measured); `TreeView` rows are `min-h-10` and its chevron button carries `hit-area` (a press 9px beside the 16px chevron toggles it); the observation page's crumb overflow button carries `hit-area`. The 40px tree row applies to every tree in the app (the records tree, the observation page's tree, Taxonomy), so each is a little taller.

**P1-23. Explore's "public data" notice, once dismissed, never comes back.** Behaviour. Needs a decision.
- **Where:** the `PageBanner` on `/pages/observations`: dismissing it and reloading leaves it gone.
- **What is wrong:** it is the only place that says sensitive records are missing and how to see them; a signed-out visitor who closes it once can no longer find out why the results are fewer.
- **The fix:** per session (not persisted), or keep persisted and add a small standing "Public data" chip on the results.

**P1-24. Terms, Privacy and Help are `span`s in the Tab order that do nothing.** A11y, Copy.
- **Where:** the three rail footer icons (`primary-rail.tsx`): "Not available in this preview yet."
- **The fix:** `aria-disabled` buttons, or links when the pages exist; "preview" wording in a product tooltip is a prototype note (also "This preview has no backend." on the auth pages), to be removed before release.

**P1-25. The marketing home is two layouts and three Log in / Sign up treatments.** Structure, Visual. **Closed 30 Oct 2026: do not touch.**
- **Where:** `/pages/biodata-home` and `/version-2` ("Option 1 of 2" is on the bar); arbitrary sizes (`text-[32px]`, `text-[36px]`, `text-[40px]`, `leading-[44px]`).
- **What is wrong:** 4.4 retires the options when one is chosen. Log in and Sign up are text links with icons on v1, `Button`s on v2, and the app header's secondary and primary pair. The v1 type uses sizes off the scale.
- **The fix:** the designer chooses one; delete the other; draw Log in and Sign up with `Button` (secondary, primary) as the header does; snap the headings to the scale.

**P1-26. The underline tab's line height is 21px, a button's and a label's is 20px.** Type.
- **Where:** `components/application/tabs` (Home, the project tabs: 14px/600/21px) against `Button` (14px/600/20px).
- **What is wrong:** one size and weight, two line heights. Source not traced in this pass.
- **The fix:** `leading-5` on the tab label, after checking the Figma tab frame.

## 4. Behaviour mismatches, in one list

P1-01 a Draft and an Under review project are public. P1-02 reviewer flags and a field note are public. P1-03 the access list and its levels are public. P1-06 a gate that says "create one" and offers none. P1-07 "your account" said to someone with none. P1-13 empty submit says nothing, and the auth forms validate three different ways. P1-14 focus lands on controls that show nothing. P1-19 "all of South Australia" is not South Australia. P1-21 an engineering page is open. P1-23 the notice that explains missing data does not return. P1-24 Tab stops that do nothing.

**Behaviours checked and consistent:** every gated action opens the same sign-up dialog (Export CSV, Create report, Upload dataset, Upload attachments, Explore Export data, Home's Create a free account); the project's "..." menu offers Export CSV and Create report only; the public header offers Log in and Sign up and no Add; the Datasets tab and the editing controls are absent; the Escape key clears the header search without keeping the text.

## 5. Decisions the designer needs to make (0.4)

| # | Question | Recommendation |
| --- | --- | --- |
| 1 | Does a signed-out visitor see Draft and Under review projects (P1-01)? | No: published only. |
| 2 | Are flags and field notes public (P1-02)? | No: members and reviewers. |
| 3 | Is the Project access tab public (P1-03)? | No: remove the tab for a signed-out visitor. |
| 4 | Completed status, VIDEO chip, the pie's categorical colours (P1-10): ingest Horizon Blue, or stay inside the set? | Stay inside the set; chart colours from a validated categorical palette. |
| 5 | The wordmark: 17px as drawn, or 18px (P1-08)? | Check the Figma node first. |
| 6 | Which marketing layout survives (P1-25)? | The designer's choice; then delete the other. |
| 7 | Is a stacked row's height exempt from the 40px target (P1-22)? | Make rows 40px; do not exempt. |
| 8 | Is the stress-test page public (P1-21)? | Admin roles only. |

## 6. Known and not re-raised

From the 6 Oct audit and the decisions since: the spelling "Licencing" in "Data Licencing Agreement (DLA)" (the nav constant is named in `2026-10-06` and the designer has not changed it); the 10px org pill and quaternary grey contrast (settled); the inert rail legal icons being "not available in this preview" (known, see P1-24 for the semantics only); the `.leaflet` map background `#dddddd` (third party); the Agentation overlay.

## 7. Next move

1. Decisions 1 to 3 first: they change what a visitor can see, and phases 2 to 4 inherit the answers (a registered user sees their own drafts, an admin sees all).
2. Then the shared fixes that remove the most sites: `RestrictedState` (P1-06, P1-07, P1-18), `SectionHeader as="h1"` plus the auth shell's `h1` and `main` (P1-05), the per-section titles (P1-04), and the password toggle and banner close focus ring (P1-14).
3. Phase 2 (registered user) when you say.
